const CONFIG = {
    // Floor plan settings
    gridSize: 50,
    gridColor: '#eee',
    waypointColor: 'red',
    pathColor: 'blue',
    
    // AR settings
    arrowScale: 0.5,
    arrowColor: 'red',
    waypointReachedDistance: 2, // meters
    
    // Navigation settings
    updateInterval: 100, // milliseconds
    
    // Simulation settings
    defaultSimulationSpeed: 0.5, // meters per second
    pathResolution: 0.1, // points per meter
    
    // Visualization settings
    arrowColors: {
        far: '#ff0000',    // Red when far
        medium: '#ffff00',  // Yellow when getting closer
        close: '#00ff00'   // Green when very close
    },
    distanceThresholds: {
        close: 2,  // meters
        medium: 5  // meters
    },
    
    // Debug settings
    debugMode: true
}; 