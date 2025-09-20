# Google Maps Setup for Marine Traffic

## Setup Instructions

1. **Get Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API (optional)
   - Create credentials (API Key)
   - Restrict the API key to your domain for security

2. **Add API Key to Environment:**
   - Create a `.env` file in the frontend directory
   - Add: `REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here`

3. **Features:**
   - Real Google Maps with satellite view
   - Interactive vessel markers with different colors and shapes
   - Click on vessels to see detailed information
   - Zoom controls and map legend
   - Toggle between Google Maps and custom map

## Vessel Types and Colors:
- **Cargo Vessels**: Blue markers
- **Tanker Vessels**: Red markers  
- **Fishing Vessels**: Green markers
- **Passenger Vessels**: Yellow markers
- **Stationary Vessels**: Gray markers

## Marker Shapes:
- **Moving Vessels**: Triangle markers (rotated by course)
- **Stationary Vessels**: Circle markers

## Alert Levels:
- **DANGER**: Bouncing red markers
- **WARNING**: Orange markers
- **SAFE**: Green/Blue markers
