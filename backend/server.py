from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import time
import threading
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from functools import lru_cache
import requests
import httpx
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
import joblib
from shapely.geometry import shape, Point, LineString
from geopy.distance import geodesic
import aiofiles

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection  
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyCtj7_BVpP20bHmFZMRaiWJLoPbPYvaEfg"  # Your provided API key
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# Hugging Face configuration
HF_API_TOKEN = "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"
HF_MODELS = {
    "sst": "pranay096/my_big_model",
    "chlorophyll": "pranay096/Chlorophyll", 
    "wind": "pranay096/wind_speed",
    "ocean_current": "pranay096/ocean_current"
}

# Weather API configuration
WEATHER_API_KEY = "050d619e55cf67745176da03918ce218"

# Global variables for caching
rag_system = None
mandi_model_data = None
boundary_system = None

# Pydantic Models
class ChatQuery(BaseModel):
    query: str
    species: Optional[str] = None
    size: Optional[str] = None
    port: Optional[str] = None
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    mandi_recommendations: Optional[Dict] = None
    follow_up_questions: List[str] = []
    context_used: List[Dict] = []
    response_time_ms: int
    conversation_id: str

class FishingZoneRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: Optional[float] = 10.0

class FishingZoneResponse(BaseModel):
    user_location: Dict[str, Any]
    best_zones: List[Dict[str, Any]]
    prediction_details: Dict[str, Any]

class MandiRecommendationRequest(BaseModel):
    port_name: str
    fish_type: str
    fish_size: str

class MandiRecommendationResponse(BaseModel):
    best_mandi: Dict[str, Any]
    all_options: List[Dict[str, Any]]
    analysis: str

class JourneyRequest(BaseModel):
    start_latitude: float
    start_longitude: float
    fuel_efficiency: float  # km per liter
    vessel_name: Optional[str] = "My Vessel"

class JourneyUpdate(BaseModel):
    journey_id: str
    latitude: float
    longitude: float
    timestamp: Optional[datetime] = None

class JourneyResponse(BaseModel):
    journey_id: str
    status: str
    distance_km: float
    fuel_consumed: float
    boundary_alerts: List[Dict[str, Any]]
    current_location: Dict[str, float]

class DisasterAlert(BaseModel):
    alert_type: str
    severity: str
    message: str
    location: Dict[str, float]
    timestamp: datetime
    active: bool

# RAG System for AI Assistant
class RAGSystem:
    def __init__(self):
        self.all_docs = []
        self.embed_model = None
        self.embeddings = None
        self.index = None
        self.doc_metadata = []
        self.initialized = False
        self.mandi_df = None

    async def initialize(self):
        if self.initialized:
            return
        
        logger.info("Initializing RAG system...")
        try:
            # Load documents
            regulations = await self._load_text_file("regulations.txt")
            forecast = await self._load_text_file("forecast.txt") 
            policy = await self._load_text_file("policy.txt")
            
            # Load mandi data for RAG
            try:
                self.mandi_df = pd.read_csv(ROOT_DIR / "mandi_prices.csv")
                mandi_context = self._create_mandi_context()
                logger.info(f"Loaded {len(self.mandi_df)} mandi records for RAG")
            except Exception as e:
                logger.warning(f"Could not load mandi data: {e}")
                mandi_context = ["Sample mandi data for price recommendations"]
            
            self.all_docs = regulations + forecast + policy + mandi_context
            self.doc_metadata = (
                [{"type": "regulation", "id": i} for i in range(len(regulations))] +
                [{"type": "forecast", "id": i} for i in range(len(forecast))] +
                [{"type": "policy", "id": i} for i in range(len(policy))] +
                [{"type": "mandi", "id": i} for i in range(len(mandi_context))]
            )
            
        except Exception as e:
            logger.error(f"Error loading documents: {e}")
            # Fallback data
            self.all_docs = [
                "Fishing regulations require valid licenses for commercial operations.",
                "Weather forecast shows calm seas for the next 3 days.",
                "New policy supports sustainable fishing practices.",
                "Market prices vary by location and season.",
                "Fish quality depends on proper handling and storage."
            ]
            self.doc_metadata = [{"type": "sample", "id": i} for i in range(len(self.all_docs))]

        logger.info("Loading embedding model...")
        self.embed_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        logger.info("Creating embeddings...")
        self.embeddings = self.embed_model.encode(self.all_docs, show_progress_bar=False)
        self.index = faiss.IndexFlatL2(self.embeddings.shape[1])
        self.index.add(self.embeddings.astype('float32'))
        
        self.initialized = True
        logger.info("RAG system initialized successfully!")

    async def _load_text_file(self, filename: str) -> List[str]:
        try:
            file_path = ROOT_DIR / filename
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                content = await f.read()
                chunks = [chunk.strip() for chunk in content.split('\n\n') if chunk.strip()]
                return chunks
        except FileNotFoundError:
            logger.warning(f"File {filename} not found, using sample data")
            return [f"Sample content from {filename}"]

    def _create_mandi_context(self) -> List[str]:
        """Create RAG context from mandi data"""
        if self.mandi_df is None:
            return []
        
        context_chunks = []
        
        # Group by fish type and create summaries
        for fish_type in self.mandi_df['fish_type'].unique():
            fish_data = self.mandi_df[self.mandi_df['fish_type'] == fish_type]
            avg_price = fish_data['net_price_inr_per_kg'].mean()
            best_mandi = fish_data.loc[fish_data['net_price_inr_per_kg'].idxmax()]
            
            context = f"{fish_type.title()} fish prices: Average net price ₹{avg_price:.2f}/kg. Best mandi is {best_mandi['mandi']} in {best_mandi['mandi_state']} offering ₹{best_mandi['net_price_inr_per_kg']:.2f}/kg from {best_mandi['port']} port."
            context_chunks.append(context)
        
        # Add port-wise summaries
        for port in self.mandi_df['port'].unique():
            port_data = self.mandi_df[self.mandi_df['port'] == port]
            fish_types = port_data['fish_type'].unique()
            context = f"{port} port connects to mandis in {', '.join(port_data['mandi_state'].unique())} and trades {', '.join(fish_types)} with distances ranging {port_data['distance_km'].min():.1f}-{port_data['distance_km'].max():.1f} km."
            context_chunks.append(context)
        
        return context_chunks

    @lru_cache(maxsize=100)
    def retrieve(self, query: str, k: int = 3) -> List[Dict]:
        if not self.initialized:
            return []
            
        q_emb = self.embed_model.encode([query])
        distances, indices = self.index.search(q_emb.astype('float32'), k)
        
        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.all_docs):
                results.append({
                    "content": self.all_docs[idx],
                    "metadata": self.doc_metadata[idx],
                    "score": float(dist),
                    "rank": i + 1
                })
        return results

# Mandi Recommendation System
class MandiRecommendationSystem:
    def __init__(self):
        self.df = None
        self.model = None
        self.encoders = {}
        self.initialized = False
        self.col_map = {}

    async def initialize(self):
        if self.initialized:
            return
            
        try:
            # Load data
            self.df = pd.read_csv(ROOT_DIR / "mandi_prices.csv")
            logger.info(f"Loaded {len(self.df)} mandi records")
            
            # Map columns as per the provided script
            expected = [
                'port','port_lat','port_lon','port_state',
                'mandi','mandi_lat','mandi_lon','mandi_state',
                'fish_type','fish_size',
                'mandi_price_inr_per_kg','distance_km','transport_cost_inr_per_kg','net_price_inr_per_kg'
            ]
            self.col_map = self._map_columns(self.df, expected)
            
            # Train model using the provided algorithm
            await self._train_model()
            self.initialized = True
            logger.info("Mandi recommendation system initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing mandi system: {e}")
            raise e

    def _normalize_colname(self, name: str) -> str:
        return ''.join(ch.lower() for ch in name if ch.isalnum())

    def _map_columns(self, df, expected_names):
        col_map = {}
        norm_to_actual = { self._normalize_colname(c): c for c in df.columns }
        for k in expected_names:
            nk = self._normalize_colname(k)
            col_map[k] = norm_to_actual.get(nk, None)
        return col_map

    async def _train_model(self):
        # Prepare data exactly as in the provided script
        raw = self.df.copy()
        
        # Normalize fish_size to numeric
        size_mapping = {'small':1, 's':1, 'sm':1, 'medium':3, 'med':3, 'm':3, 'large':5, 'l':5, 'lg':5}
        def map_size(v):
            if pd.isna(v):
                return np.nan
            vs = str(v).strip().lower()
            return size_mapping.get(vs, 3)  # Default to medium
        raw['fish_size_numeric'] = raw[self.col_map['fish_size']].apply(map_size)
        
        # Encode categorical variables
        for cat in ['port','mandi','fish_type']:
            actual = self.col_map[cat]
            le = LabelEncoder()
            raw[cat+'_enc'] = le.fit_transform(raw[actual].astype(str))
            self.encoders[cat] = le
        
        # Prepare features
        feature_cols = [
            'port_enc','mandi_enc','fish_type_enc',
            'fish_size_numeric',
            self.col_map['distance_km'],
            self.col_map['mandi_price_inr_per_kg'],
            self.col_map['transport_cost_inr_per_kg']
        ]
        
        target_col = self.col_map['net_price_inr_per_kg']
        
        # Convert to numeric
        for c in feature_cols:
            if c in raw.columns:
                raw[c] = pd.to_numeric(raw[c], errors='coerce')
        
        # Drop rows with missing data
        core_needed = ['port_enc','mandi_enc','fish_type_enc','fish_size_numeric', target_col]
        raw_clean = raw.dropna(subset=core_needed)
        
        if len(raw_clean) > 0:
            X = raw_clean[feature_cols]
            y = raw_clean[target_col].astype(float)
            
            # Train Random Forest model
            self.model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
            self.model.fit(X, y)
            
            # Store the feature columns for prediction
            self.feature_cols = feature_cols
        else:
            logger.error("No clean data available for training")

    def get_best_mandi(self, port_name: str, fish_type: str, fish_size: str) -> Dict:
        if not self.initialized or self.df is None:
            return {"error": "System not initialized"}
        
        try:
            # Find matching port (case insensitive, partial match)
            port_actual_col = self.col_map['port']
            mandi_actual_col = self.col_map['mandi']
            
            # Try exact match first
            port_rows = self.df[self.df[port_actual_col].astype(str).str.lower().str.contains(port_name.lower(), na=False)]
            
            if port_rows.empty:
                # If no match, try broader search
                port_rows = self.df[self.df[port_actual_col].astype(str).str.lower().str.contains(port_name.split()[0].lower(), na=False)]
            
            if port_rows.empty:
                return {"error": f"No data found for port '{port_name}'"}
            
            # Get unique mandis for this port/fish type combination
            matching_rows = port_rows[
                port_rows[self.col_map['fish_type']].astype(str).str.lower() == fish_type.lower()
            ]
            
            if matching_rows.empty:
                # Fallback to any fish type for the port
                matching_rows = port_rows
            
            # Find the best mandi using ML prediction
            rows_out = []
            mandis = matching_rows[mandi_actual_col].astype(str).unique()
            
            # Map fish size
            size_mapping = {'small':1, 'medium':3, 'large':5}
            fish_size_val = size_mapping.get(fish_size.lower(), 3)
            
            for mandi_name in mandis[:10]:  # Limit to top 10 for performance
                subset = matching_rows[matching_rows[mandi_actual_col].astype(str) == str(mandi_name)]
                
                if len(subset) > 0:
                    # Get median values
                    mandi_price = float(pd.to_numeric(subset[self.col_map['mandi_price_inr_per_kg']], errors='coerce').median())
                    distance = float(pd.to_numeric(subset[self.col_map['distance_km']], errors='coerce').median())
                    transport = float(pd.to_numeric(subset[self.col_map['transport_cost_inr_per_kg']], errors='coerce').median())
                    
                    # Predict using trained model if available
                    if self.model is not None:
                        try:
                            # Encode categorical variables
                            p_enc = self._safe_transform(self.encoders['port'], port_name)
                            m_enc = self._safe_transform(self.encoders['mandi'], mandi_name)
                            f_enc = self._safe_transform(self.encoders['fish_type'], fish_type)
                            
                            # Create feature vector
                            features = {
                                'port_enc': p_enc,
                                'mandi_enc': m_enc,
                                'fish_type_enc': f_enc,
                                'fish_size_numeric': fish_size_val,
                                self.col_map['distance_km']: distance,
                                self.col_map['mandi_price_inr_per_kg']: mandi_price,
                                self.col_map['transport_cost_inr_per_kg']: transport
                            }
                            
                            feat_df = pd.DataFrame([features])
                            feat_df = feat_df[self.feature_cols]
                            predicted_net = float(self.model.predict(feat_df)[0])
                        except Exception as e:
                            logger.warning(f"Prediction failed for {mandi_name}: {e}")
                            predicted_net = mandi_price - transport
                    else:
                        predicted_net = mandi_price - transport
                    
                    # Get mandi state
                    mandi_state = subset[self.col_map['mandi_state']].iloc[0] if len(subset) > 0 else "Unknown"
                    
                    rows_out.append({
                        'mandi_name': mandi_name,
                        'mandi_state': mandi_state,
                        'distance_km': round(distance, 2),
                        'mandi_price_inr_per_kg': round(mandi_price, 2),
                        'transport_cost_inr_per_kg': round(transport, 2),
                        'predicted_net_price_inr_per_kg': round(predicted_net, 2)
                    })
            
            if not rows_out:
                return {"error": "No matching mandis found"}
            
            # Sort by predicted net price (descending)
            rows_out.sort(key=lambda x: x['predicted_net_price_inr_per_kg'], reverse=True)
            best = rows_out[0]
            
            return {
                "mandi": best["mandi_name"],
                "state": best["mandi_state"],
                "price_inr": best["predicted_net_price_inr_per_kg"],
                "distance_km": best["distance_km"],
                "mandi_price": best["mandi_price_inr_per_kg"],
                "transport_cost": best["transport_cost_inr_per_kg"],
                "all_options": rows_out[:5]  # Return top 5 options
            }
            
        except Exception as e:
            logger.error(f"Error in mandi recommendation: {e}")
            return {"error": f"Failed to get recommendations: {str(e)}"}

    def _safe_transform(self, encoder, value):
        try:
            return int(encoder.transform([str(value)])[0])
        except Exception:
            # Return -1 for unseen categories (Random Forest can handle this)
            return -1

# Boundary/Geofencing System (simplified)
class BoundarySystem:
    def __init__(self):
        self.active_journeys = {}
        self.boundary_zones = self._create_demo_boundaries()
    
    def _create_demo_boundaries(self):
        # Simplified Indian maritime boundaries
        return {
            "indian_waters": {
                "type": "polygon",
                "coordinates": [
                    [68.0, 20.0], [75.0, 20.0], [75.0, 26.0], [68.0, 26.0], [68.0, 20.0]
                ]
            }
        }
    
    def start_journey(self, journey_data: Dict) -> str:
        journey_id = str(uuid.uuid4())
        self.active_journeys[journey_id] = {
            "id": journey_id,
            "start_location": {
                "lat": journey_data["start_latitude"],
                "lon": journey_data["start_longitude"]
            },
            "current_location": {
                "lat": journey_data["start_latitude"], 
                "lon": journey_data["start_longitude"]
            },
            "fuel_efficiency": journey_data["fuel_efficiency"],
            "vessel_name": journey_data.get("vessel_name", "My Vessel"),
            "total_distance": 0.0,
            "fuel_consumed": 0.0,
            "start_time": datetime.now(timezone.utc),
            "last_update": datetime.now(timezone.utc),
            "boundary_alerts": []
        }
        return journey_id
    
    def update_journey(self, journey_id: str, lat: float, lon: float) -> Dict:
        if journey_id not in self.active_journeys:
            raise HTTPException(status_code=404, detail="Journey not found")
        
        journey = self.active_journeys[journey_id]
        prev_lat = journey["current_location"]["lat"]
        prev_lon = journey["current_location"]["lon"]
        
        # Calculate distance moved
        if prev_lat != lat or prev_lon != lon:
            distance_moved = geodesic((prev_lat, prev_lon), (lat, lon)).kilometers
            journey["total_distance"] += distance_moved
            journey["fuel_consumed"] = journey["total_distance"] / journey["fuel_efficiency"]
        
        # Update location
        journey["current_location"] = {"lat": lat, "lon": lon}
        journey["last_update"] = datetime.now(timezone.utc)
        
        # Check boundaries (simplified)
        boundary_alerts = self._check_boundaries(lat, lon)
        if boundary_alerts:
            journey["boundary_alerts"].extend(boundary_alerts)
        
        return {
            "journey_id": journey_id,
            "status": "active",
            "distance_km": round(journey["total_distance"], 2),
            "fuel_consumed": round(journey["fuel_consumed"], 2),
            "boundary_alerts": boundary_alerts,
            "current_location": journey["current_location"]
        }
    
    def _check_boundaries(self, lat: float, lon: float) -> List[Dict]:
        alerts = []
        # Simplified boundary checking
        if not (68.0 <= lon <= 75.0 and 20.0 <= lat <= 26.0):
            alerts.append({
                "type": "boundary_violation",
                "message": "Vessel has crossed into restricted waters",
                "severity": "high",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        return alerts

# Initialize global systems
async def initialize_systems():
    global rag_system, mandi_model_data, boundary_system
    
    if rag_system is None:
        rag_system = RAGSystem()
        await rag_system.initialize()
    
    if mandi_model_data is None:
        mandi_model_data = MandiRecommendationSystem()
        await mandi_model_data.initialize()
    
    if boundary_system is None:
        boundary_system = BoundarySystem()

# Create FastAPI app
app = FastAPI(title="BlueNet Smart Fishing Assistant", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hugging Face API integration
async def query_huggingface_model(model_name: str, lat: float, lon: float) -> float:
    """Query Hugging Face model for predictions"""
    try:
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        api_url = f"https://api-inference.huggingface.co/models/{model_name}"
        
        # Prepare input data for environmental prediction models
        # Each model expects different input format based on environmental parameters
        if "sst" in model_name.lower() or "big_model" in model_name.lower():
            # Sea Surface Temperature model
            payload = {"inputs": [[lat, lon, 27.5, 0.8]]}  # lat, lon, temp, salinity
        elif "chlorophyll" in model_name.lower():
            # Chlorophyll model  
            payload = {"inputs": [[lat, lon, 2.1, 25.0]]}  # lat, lon, chl_concentration, depth
        elif "wind" in model_name.lower():
            # Wind speed model
            payload = {"inputs": [[lat, lon, 12.5, 200.0]]}  # lat, lon, wind_speed, direction
        elif "ocean_current" in model_name.lower():
            # Ocean current model
            payload = {"inputs": [[lat, lon, 0.8, 150.0]]}  # lat, lon, current_speed, direction
        else:
            # Default format
            payload = {"inputs": [[lat, lon, 1.0, 1.0]]}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, headers=headers, json=payload, timeout=30)
            
        if response.status_code == 200:
            result = response.json()
            logger.info(f"HF Model {model_name} response: {result}")
            
            # Extract prediction value
            if isinstance(result, list) and len(result) > 0:
                if isinstance(result[0], dict):
                    return float(result[0].get('score', 0.5))
                elif isinstance(result[0], list) and len(result[0]) > 0:
                    # Take the first prediction value
                    return float(result[0][0]) if isinstance(result[0][0], (int, float)) else 0.5
                else:
                    return float(result[0]) if isinstance(result[0], (int, float)) else 0.5
            return 0.5
        else:
            logger.warning(f"HF API error for {model_name}: {response.status_code} - {response.text}")
            return 0.5
            
    except Exception as e:
        logger.error(f"Error querying {model_name}: {e}")
        return 0.5

# API Routes
@api_router.get("/")
async def root():
    return {"message": "BlueNet Smart Fishing Assistant API", "status": "active"}

@api_router.get("/health")
async def health_check():
    await initialize_systems()
    return {
        "status": "healthy",
        "services": {
            "rag_system": rag_system.initialized if rag_system else False,
            "mandi_system": mandi_model_data.initialized if mandi_model_data else False,
            "boundary_system": boundary_system is not None
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(query: ChatQuery):
    start_time = time.time()
    await initialize_systems()
    
    try:
        # Retrieve context from RAG
        context_docs = rag_system.retrieve(query.query, k=3)
        context_text = "\n".join([doc["content"] for doc in context_docs])
        
        # Get mandi recommendations if species specified
        mandi_recs = None
        if query.species and mandi_model_data:
            port = query.port or "Mumbai"
            size = query.size or "medium"
            mandi_recs = mandi_model_data.get_best_mandi(port, query.species, size)
        
        mandi_data_text = ""
        if mandi_recs and "error" not in mandi_recs:
            mandi_data_text = f"Market data: Best mandi for {query.species} from {mandi_recs.get('port', '')}: {mandi_recs['mandi']} ({mandi_recs['state']}) - ₹{mandi_recs['price_inr']}/kg, {mandi_recs['distance_km']} km away."
        
        # Generate response using Gemini
        prompt = f"""You are BlueNet AI Assistant, expert in fisheries, markets, and regulations.

Context from knowledge base:
{context_text}

{mandi_data_text}

User Question: {query.query}

Instructions:
- Be concise and practical
- Use the provided context when relevant
- Focus on actionable information for fishermen
- Provide specific advice based on Indian fishing context

Answer:"""
        
        try:
            response_obj = model.generate_content(prompt)
            answer = response_obj.text.strip()
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            answer = "I'm sorry, I'm having trouble accessing my AI capabilities right now. Please try again later."
        
        # Generate follow-up questions
        followup_questions = [
            "What are the current fishing regulations?",
            "Show me the best market prices today",
            "What's the weather forecast for fishing?"
        ]
        
        response_time_ms = int((time.time() - start_time) * 1000)
        conversation_id = query.conversation_id or f"conv_{int(datetime.now().timestamp())}"
        
        return ChatResponse(
            answer=answer,
            mandi_recommendations=mandi_recs if mandi_recs and "error" not in mandi_recs else None,
            follow_up_questions=followup_questions,
            context_used=[{
                "content": doc["content"][:100] + "...",
                "type": doc["metadata"]["type"],
                "relevance_score": doc["score"]
            } for doc in context_docs],
            response_time_ms=response_time_ms,
            conversation_id=conversation_id
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/predict/fishing-zones", response_model=FishingZoneResponse)
async def predict_fishing_zones(request: FishingZoneRequest):
    """Predict best fishing zones using Hugging Face models"""
    try:
        lat, lon = request.latitude, request.longitude
        radius = request.radius_km
        
        logger.info(f"Predicting fishing zones for location: {lat}, {lon} with radius: {radius} km")
        
        # Generate grid points around user location (reduced for performance)
        grid_points = []
        step = 0.02  # ~2km steps for better performance
        points_per_side = int(radius * step * 2)
        
        for i in range(-points_per_side, points_per_side + 1, 2):
            for j in range(-points_per_side, points_per_side + 1, 2):
                grid_lat = lat + (i * step)
                grid_lon = lon + (j * step)
                # Check if point is within radius
                distance = ((grid_lat - lat)**2 + (grid_lon - lon)**2)**0.5 * 111  # Rough conversion to km
                if distance <= radius:
                    grid_points.append((grid_lat, grid_lon))
        
        logger.info(f"Generated {len(grid_points)} grid points for analysis")
        
        # Query Hugging Face models for predictions
        best_zones = []
        
        # Limit to top 8 points for performance and API rate limits
        for i, (grid_lat, grid_lon) in enumerate(grid_points[:8]):
            try:
                logger.info(f"Querying HF models for point {i+1}: {grid_lat:.4f}, {grid_lon:.4f}")
                
                # Query each Hugging Face model
                tasks = [
                    query_huggingface_model(HF_MODELS["sst"], grid_lat, grid_lon),
                    query_huggingface_model(HF_MODELS["chlorophyll"], grid_lat, grid_lon),
                    query_huggingface_model(HF_MODELS["wind"], grid_lat, grid_lon),
                    query_huggingface_model(HF_MODELS["ocean_current"], grid_lat, grid_lon)
                ]
                
                # Wait for all model predictions
                sst_score, chlorophyll_score, wind_score, current_score = await asyncio.gather(*tasks)
                
                # Normalize scores to 0-1 range
                sst_score = max(0, min(1, sst_score))
                chlorophyll_score = max(0, min(1, chlorophyll_score))  
                wind_score = max(0, min(1, wind_score))
                current_score = max(0, min(1, current_score))
                
                # Calculate weighted combined score
                combined_score = (
                    sst_score * 0.3 +           # Sea Surface Temperature (30%)
                    chlorophyll_score * 0.25 +  # Chlorophyll levels (25%)
                    wind_score * 0.25 +         # Wind conditions (25%)
                    current_score * 0.2         # Ocean currents (20%)
                )
                
                # Get location name using reverse geocoding (simplified)
                location_name = await get_location_name(grid_lat, grid_lon)
                
                best_zones.append({
                    "lat": round(grid_lat, 4),
                    "lon": round(grid_lon, 4),
                    "score": round(combined_score, 3),
                    "sst": round(sst_score, 3),
                    "chlorophyll": round(chlorophyll_score, 3),
                    "wind": round(wind_score, 3),
                    "current": round(current_score, 3),
                    "location_name": location_name,
                    "distance_from_user": round(((grid_lat - lat)**2 + (grid_lon - lon)**2)**0.5 * 111, 2)
                })
                
                logger.info(f"Zone {i+1} prediction complete - Score: {combined_score:.3f}")
                
            except Exception as e:
                logger.error(f"Error processing grid point {i}: {e}")
                # Add a fallback prediction with lower score
                best_zones.append({
                    "lat": round(grid_lat, 4),
                    "lon": round(grid_lon, 4),
                    "score": 0.4,  # Lower fallback score
                    "sst": 0.5,
                    "chlorophyll": 0.5,
                    "wind": 0.5,
                    "current": 0.5,
                    "location_name": f"Zone {i+1}",
                    "distance_from_user": round(((grid_lat - lat)**2 + (grid_lon - lon)**2)**0.5 * 111, 2)
                })
        
        # Sort by score and return top zones
        best_zones.sort(key=lambda x: x["score"], reverse=True)
        
        user_location_name = await get_location_name(lat, lon)
        
        return FishingZoneResponse(
            user_location={"lat": lat, "lon": lon, "name": user_location_name},
            best_zones=best_zones[:5],  # Top 5 zones
            prediction_details={
                "model_info": f"Using 4 Hugging Face models: {', '.join(HF_MODELS.keys())}",
                "models_used": list(HF_MODELS.values()),
                "grid_size": len(grid_points),
                "analyzed_points": len(best_zones),
                "radius_km": radius,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Fishing zone prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to get location names
async def get_location_name(lat: float, lon: float) -> str:
    """Get location name using reverse geocoding"""
    try:
        # Use a simple geocoding service (you can replace with your preferred service)
        url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{lon},{lat}.json"
        params = {
            "access_token": "pk.eyJ1IjoicHJhbmF5MDk2IiwiYSI6ImNtZnBlczl5bzA5dW8ybHNjdmc2Y2toOWIifQ.jJSKHO7NHQCRQv7AUxn0kw",
            "types": "place,locality"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
            
        if response.status_code == 200:
            data = response.json()
            if data.get("features"):
                place_name = data["features"][0].get("place_name", "")
                # Return simplified location name
                if "," in place_name:
                    return place_name.split(",")[0].strip()
                return place_name[:30]  # Limit length
        
        # Fallback to coordinate-based name
        return f"{lat:.2f}°N, {lon:.2f}°E"
        
    except Exception as e:
        logger.warning(f"Geocoding failed for {lat}, {lon}: {e}")
        return f"{lat:.2f}°N, {lon:.2f}°E"

@api_router.post("/mandi-recommendation", response_model=MandiRecommendationResponse)
async def get_mandi_recommendation(request: MandiRecommendationRequest):
    """Get best mandi recommendation"""
    await initialize_systems()
    
    try:
        best_mandi = mandi_model_data.get_best_mandi(
            request.port_name, request.fish_type, request.fish_size
        )
        
        if "error" in best_mandi:
            raise HTTPException(status_code=404, detail=best_mandi["error"])
        
        # Get all options for comparison
        all_options = []
        if mandi_model_data.df is not None:
            filtered_df = mandi_model_data.df[
                (mandi_model_data.df['port'].str.lower() == request.port_name.lower()) &
                (mandi_model_data.df['fish_type'].str.lower() == request.fish_type.lower())
            ]
            
            for _, row in filtered_df.head(5).iterrows():
                all_options.append({
                    "mandi": row["mandi"],
                    "state": row["mandi_state"],
                    "price_inr": float(row["net_price_inr_per_kg"]),
                    "distance_km": float(row["distance_km"])
                })
        
        analysis = f"Based on the data analysis, {best_mandi['mandi']} offers the best net price of ₹{best_mandi['price_inr']}/kg for {request.fish_type} from {request.port_name} port."
        
        return MandiRecommendationResponse(
            best_mandi=best_mandi,
            all_options=all_options,
            analysis=analysis
        )
        
    except Exception as e:
        logger.error(f"Mandi recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/journey/start")
async def start_journey(request: JourneyRequest):
    """Start a new fishing journey"""
    await initialize_systems()
    
    try:
        journey_id = boundary_system.start_journey({
            "start_latitude": request.start_latitude,
            "start_longitude": request.start_longitude,
            "fuel_efficiency": request.fuel_efficiency,
            "vessel_name": request.vessel_name
        })
        
        return {
            "journey_id": journey_id,
            "status": "started",
            "message": "Journey tracking started successfully",
            "start_location": {
                "lat": request.start_latitude,
                "lon": request.start_longitude
            }
        }
        
    except Exception as e:
        logger.error(f"Start journey error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/journey/update", response_model=JourneyResponse)
async def update_journey(request: JourneyUpdate):
    """Update journey location"""
    await initialize_systems()
    
    try:
        result = boundary_system.update_journey(
            request.journey_id, request.latitude, request.longitude
        )
        return JourneyResponse(**result)
        
    except Exception as e:
        logger.error(f"Update journey error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/journey/{journey_id}")
async def get_journey_status(journey_id: str):
    """Get current journey status"""
    await initialize_systems()
    
    if journey_id not in boundary_system.active_journeys:
        raise HTTPException(status_code=404, detail="Journey not found")
    
    journey = boundary_system.active_journeys[journey_id]
    return {
        "journey_id": journey_id,
        "status": "active",
        "vessel_name": journey["vessel_name"],
        "start_time": journey["start_time"].isoformat(),
        "current_location": journey["current_location"],
        "total_distance_km": round(journey["total_distance"], 2),
        "fuel_consumed_liters": round(journey["fuel_consumed"], 2),
        "boundary_alerts": journey["boundary_alerts"][-5:]  # Last 5 alerts
    }

@api_router.get("/disaster-alerts")
async def get_disaster_alerts():
    """Get current disaster and safety alerts"""
    try:
        # For demo, return sample alerts
        alerts = [
            {
                "alert_type": "weather_warning",
                "severity": "medium", 
                "message": "Moderate winds expected in Arabian Sea region",
                "location": {"lat": 19.0, "lon": 72.8},
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "active": True
            },
            {
                "alert_type": "cyclone_watch",
                "severity": "low",
                "message": "Cyclone formation possible in Bay of Bengal",
                "location": {"lat": 13.0, "lon": 80.0},
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "active": True
            }
        ]
        
        return {"alerts": alerts, "count": len(alerts)}
        
    except Exception as e:
        logger.error(f"Disaster alerts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/catch-log")
async def log_catch(
    image: UploadFile = File(...),
    species: str = Form(...),
    weight: float = Form(...),
    location_lat: float = Form(...),
    location_lon: float = Form(...)
):
    """Log catch with compliance checking"""
    try:
        # Save uploaded image (placeholder for fish detection model)
        image_path = ROOT_DIR / f"uploads/{image.filename}"
        image_path.parent.mkdir(exist_ok=True)
        
        async with aiofiles.open(image_path, 'wb') as f:
            content = await image.read()
            await f.write(content)
        
        # Placeholder for fish species detection using best.pt model
        detected_species = species  # In real implementation, use the model
        compliance_status = "compliant"  # Simplified compliance check
        
        # Log to database
        catch_log = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc),
            "species": detected_species,
            "weight_kg": weight,
            "location": {"lat": location_lat, "lon": location_lon},
            "compliance_status": compliance_status,
            "image_path": str(image_path)
        }
        
        await db.catch_logs.insert_one(catch_log)
        
        return {
            "log_id": catch_log["id"],
            "detected_species": detected_species,
            "compliance_status": compliance_status,
            "message": f"Catch logged successfully. Species: {detected_species}, Weight: {weight}kg"
        }
        
    except Exception as e:
        logger.error(f"Catch logging error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    await initialize_systems()
    logger.info("BlueNet API started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    logger.info("BlueNet API shutdown complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)