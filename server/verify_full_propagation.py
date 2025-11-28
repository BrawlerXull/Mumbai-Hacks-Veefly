
import sys
import os
import json
from app import app

def test_full_propagation():
    print("Testing /api/track-propagation for multi-platform data...")
    
    client = app.test_client()
    claim = "Elon Musk crypto scam"
    
    try:
        response = client.post('/api/track-propagation', 
                             data=json.dumps({'claim': claim}),
                             content_type='application/json')
        
        if response.status_code == 200:
            data = json.loads(response.data)
            print("Verification SUCCESS: Endpoint returned 200.")
            
            origins = data.get('origins', [])
            graph_nodes = data.get('graph_data', {}).get('nodes', [])
            
            platforms = set(n.get('platform') for n in graph_nodes)
            
            print(f"Origins Found: {len(origins)}")
            print(f"Total Nodes: {len(graph_nodes)}")
            print(f"Platforms Found in Graph: {platforms}")
            
            if 'twitter' in platforms:
                print("✅ Twitter data found.")
            else:
                print("⚠️ Twitter data NOT found (check API key or limits).")
                
            if 'reddit' in platforms:
                print("✅ Reddit data found.")
            else:
                print("⚠️ Reddit data NOT found (check API key or limits).")
                
            if 'web' in platforms:
                print("✅ Web (Google) data found.")
                
        else:
            print(f"Verification FAILED: {response.status_code}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_full_propagation()
