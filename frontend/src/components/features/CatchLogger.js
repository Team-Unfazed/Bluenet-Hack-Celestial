import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  Camera, 
  Upload, 
  Fish, 
  MapPin, 
  Weight, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const CatchLogger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [formData, setFormData] = useState({
    species: '',
    weight: '',
    location_lat: '',
    location_lon: ''
  });
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setCurrentLocation(location);
          setFormData(prev => ({
            ...prev,
            location_lat: location.lat.toString(),
            location_lon: location.lon.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please enter manually.');
        }
      );
    }
  };

  // Start camera for photo capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please use file upload instead.');
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        setCapturedImage(blob);
        // Stop camera
        const stream = video.srcObject;
        stream.getTracks().forEach(track => track.stop());
        setShowCamera(false);
      }, 'image/jpeg', 0.8);
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCapturedImage(file);
    }
  };

  // Detect fish species (mock implementation - can be replaced with real AI model)
  const detectFishSpecies = async (imageFile) => {
    setIsLoading(true);
    
    // Mock fish species detection (replace with real AI model call)
    const mockSpecies = [
      { name: 'Pomfret', confidence: 0.85, size: 'Medium', compliance: 'Compliant' },
      { name: 'Mackerel', confidence: 0.78, size: 'Small', compliance: 'Compliant' },
      { name: 'Sardine', confidence: 0.92, size: 'Small', compliance: 'Compliant' },
      { name: 'Tuna', confidence: 0.67, size: 'Large', compliance: 'Check Size Limit' },
      { name: 'Kingfish', confidence: 0.74, size: 'Large', compliance: 'Compliant' }
    ];
    
    // Simulate API delay
    setTimeout(() => {
      const randomSpecies = mockSpecies[Math.floor(Math.random() * mockSpecies.length)];
      setDetectionResult(randomSpecies);
      setFormData(prev => ({
        ...prev,
        species: randomSpecies.name.toLowerCase()
      }));
      setIsLoading(false);
    }, 2000);
  };

  // Submit catch log
  const submitCatchLog = async (e) => {
    e.preventDefault();
    
    if (!capturedImage) {
      alert('Please capture or upload an image first.');
      return;
    }
    
    if (!formData.weight || !formData.location_lat || !formData.location_lon) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create catch log entry
      const catchLogEntry = {
        id: `catch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        species: formData.species,
        weight_kg: parseFloat(formData.weight),
        location: {
          lat: parseFloat(formData.location_lat),
          lon: parseFloat(formData.location_lon)
        },
        ai_classification: detectionResult ? {
          predicted_species: detectionResult.name,
          confidence: detectionResult.confidence,
          compliance: detectionResult.compliance
        } : null,
        compliance_status: detectionResult ? detectionResult.compliance : 'Unknown',
        timestamp: new Date().toISOString(),
        image_captured: true,
        environmental_conditions: {
          sea_temp: "27.5°C",
          wind: "12.0 knots",
          current: "2.3 knots"
        }
      };

      // Save to offline data (localStorage)
      const existingOfflineData = JSON.parse(localStorage.getItem('bluenet_offline_data') || '{}');
      const catchLogs = existingOfflineData.catchLogs || [];
      catchLogs.push(catchLogEntry);
      
      const updatedOfflineData = {
        ...existingOfflineData,
        catchLogs: catchLogs,
        lastUpdate: new Date().toISOString()
      };
      
      localStorage.setItem('bluenet_offline_data', JSON.stringify(updatedOfflineData));
      
      // Try to send to backend (if online)
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          const formDataToSend = new FormData();
          formDataToSend.append('image', capturedImage);
          formDataToSend.append('species', formData.species);
          formDataToSend.append('weight', parseFloat(formData.weight));
          formDataToSend.append('location_lat', parseFloat(formData.location_lat));
          formDataToSend.append('location_lon', parseFloat(formData.location_lon));
          
          const response = await fetch(`${backendUrl}/api/catch-log`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formDataToSend
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Catch log synced to backend:', result.log_id);
          }
        } catch (error) {
          console.log('Backend sync failed, saved locally only:', error);
        }
      }
      
      alert(`Catch logged successfully! 
      
✅ Species: ${formData.species}
✅ Weight: ${formData.weight}kg
✅ Location: ${parseFloat(formData.location_lat).toFixed(4)}°N, ${parseFloat(formData.location_lon).toFixed(4)}°E
${detectionResult ? `✅ AI Detection: ${detectionResult.name} (${Math.round(detectionResult.confidence * 100)}% confidence)` : ''}
📱 Saved to offline data for export`);
      
      // Reset form
      setCapturedImage(null);
      setDetectionResult(null);
      setFormData({
        species: '',
        weight: '',
        location_lat: '',
        location_lon: ''
      });
      
    } catch (error) {
      console.error('Error logging catch:', error);
      alert('Error saving catch log. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catch Logger</h2>
          <p className="text-gray-600">Log your catch with AI-powered species identification</p>
        </div>
        <Button onClick={getCurrentLocation} variant="outline">
          <MapPin className="w-4 h-4 mr-2" />
          Get Location
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Capture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Fish Image</CardTitle>
            <CardDescription>Capture or upload an image of your catch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!capturedImage && !showCamera && (
              <div className="flex flex-col space-y-3">
                <Button onClick={startCamera} className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline" 
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {showCamera && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <div className="flex space-x-2">
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Capture
                  </Button>
                  <Button 
                    onClick={() => setShowCamera(false)} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {capturedImage && (
              <div className="space-y-4">
                <img
                  src={URL.createObjectURL(capturedImage)}
                  alt="Captured fish"
                  className="w-full rounded-lg"
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => detectFishSpecies(capturedImage)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Fish className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Detecting...' : 'Identify Species'}
                  </Button>
                  <Button 
                    onClick={() => setCapturedImage(null)}
                    variant="outline"
                  >
                    Retake
                  </Button>
                </div>
              </div>
            )}

            {detectionResult && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-800">
                      {detectionResult.name}
                    </span>
                    <Badge variant={detectionResult.compliance === 'Compliant' ? 'default' : 'destructive'}>
                      {detectionResult.compliance}
                    </Badge>
                  </div>
                  <p className="text-sm text-green-600">
                    Confidence: {Math.round(detectionResult.confidence * 100)}% | 
                    Size: {detectionResult.size}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Catch Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Catch Details</CardTitle>
            <CardDescription>Enter details about your catch</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitCatchLog} className="space-y-4">
              <div>
                <Label htmlFor="species">Fish Species</Label>
                <Input
                  id="species"
                  value={formData.species}
                  onChange={(e) => setFormData(prev => ({...prev, species: e.target.value}))}
                  placeholder="e.g., pomfret, mackerel"
                  required
                />
              </div>

              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({...prev, weight: e.target.value}))}
                  placeholder="e.g., 2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.location_lat}
                    onChange={(e) => setFormData(prev => ({...prev, location_lat: e.target.value}))}
                    placeholder="19.0760"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lon">Longitude</Label>
                  <Input
                    id="lon"
                    type="number"
                    step="any"
                    value={formData.location_lon}
                    onChange={(e) => setFormData(prev => ({...prev, location_lon: e.target.value}))}
                    placeholder="72.8777"
                    required
                  />
                </div>
              </div>

              {currentLocation && (
                <div className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Location captured: {currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !capturedImage}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Fish className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Logging...' : 'Log Catch'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CatchLogger;