class ARNavigationApp {
    constructor() {
        this.initialized = false;
        this.navigationActive = false;
        this.currentDestination = null;
        this.lastDistanceUpdate = 0;
        
        // Initialize components
        this.initializeComponents();
        
        this.currentLocationSelect = document.getElementById('currentLocation');
        this.destinationSelect = document.getElementById('destination');
    }

    setupEventListeners() {
        // Handle location selections
        this.currentLocationSelect.addEventListener('change', (event) => {
            const selectedId = event.target.value;
            if (selectedId) {
                const vertex = this.floorPlanRenderer.getVertexById(selectedId);
                console.log('Selected current location:', vertex.objectName);
                this.floorPlanRenderer.selectedCalibrationPoint = {
                    id: vertex.id,
                    objectName: vertex.objectName,
                    x: vertex.cx,
                    y: vertex.cy
                };
                this.floorPlanRenderer.showCalibrationMarker(
                    vertex.cx * this.floorPlanRenderer.scale,
                    vertex.cy * this.floorPlanRenderer.scale
                );
                this.checkNavigationReady();
            }
        });

        this.destinationSelect.addEventListener('change', (event) => {
            const selectedId = event.target.value;
            if (selectedId) {
                const vertex = this.floorPlanRenderer.getVertexById(selectedId);
                console.log('Selected destination:', vertex.objectName);
                this.currentDestination = vertex;
                this.floorPlanRenderer.highlightDestination(vertex);
                this.checkNavigationReady();
            }
        });

        document.getElementById('startNavigation').addEventListener('click', () => {
            this.startNavigation();
        });
    }

    checkNavigationReady() {
        const startButton = document.getElementById('startNavigation');
        if (this.currentLocationSelect.value && this.destinationSelect.value) {
            if (this.currentLocationSelect.value !== this.destinationSelect.value) {
                startButton.disabled = false;
            } else {
                startButton.disabled = true;
                this.updateStatus('Start and destination cannot be the same');
            }
        }
    }

    startNavigation() {
        if (!this.currentLocationSelect.value || !this.destinationSelect.value) {
            this.updateStatus('Please select both locations first');
            return;
        }

        this.navigationActive = true;
        console.log('Starting navigation from', 
            this.currentLocationSelect.options[this.currentLocationSelect.selectedIndex].text,
            'to', 
            this.destinationSelect.options[this.destinationSelect.selectedIndex].text);

        // Set up AR navigation
        this.arNavigator.setTargetWaypoint(this.currentDestination);
        this.arNavigator.startNavigation();

        // Update UI
        const startButton = document.getElementById('startNavigation');
        startButton.textContent = 'Navigation Active';
        startButton.disabled = true;
        this.currentLocationSelect.disabled = true;
        this.destinationSelect.disabled = true;

        // Start simulation if in debug mode
        if (CONFIG.debugMode && this.simulator) {
            this.simulator.startSimulationPath(
                this.floorPlanRenderer.selectedCalibrationPoint,
                this.currentDestination
            );
        }
    }

    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('status-indicator');
        statusElement.textContent = message;
        statusElement.className = `status-indicator ${type}`;
    }
}

// Initialize the application when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ARNavigationApp();
});