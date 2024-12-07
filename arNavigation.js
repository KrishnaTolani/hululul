class ARNavigator {
    constructor(floorPlanRenderer) {
        this.floorPlanRenderer = floorPlanRenderer;
        this.arrowEntity = document.getElementById('navigationArrow');
        this.currentWaypoint = null;
        this.lastUpdateTime = 0;
        this.userPosition = { x: 0, y: 0, z: 0 };
        this.userHeading = 0;
    }

    async calibratePosition(selectedPoint) {
        try {
            if (!selectedPoint) {
                throw new Error('No calibration point selected');
            }

            // Store the calibration point
            this.calibrationPoint = {
                id: selectedPoint.id,
                x: selectedPoint.x,
                y: selectedPoint.y,
                objectName: selectedPoint.objectName
            };

            // Set initial position
            this.userPosition = {
                x: selectedPoint.x,
                y: 0,  // Height remains 0 for 2D navigation
                z: selectedPoint.y
            };

            console.log('Calibration point set:', this.calibrationPoint);
            return true;
        } catch (error) {
            console.error('Calibration error:', error);
            throw error;
        }
    }

    // ... rest of your ARNavigator class methods ...
} 