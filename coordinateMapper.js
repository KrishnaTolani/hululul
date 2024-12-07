class CoordinateMapper {
    constructor(floorPlanRenderer) {
        this.floorPlanRenderer = floorPlanRenderer;
        this.originPoint = null; // Grid coordinates of calibration point
        this.worldOrigin = null; // AR world coordinates of calibration point
        this.scale = 1.0; // meters per grid unit
        this.rotation = 0; // degrees clockwise from north
    }

    async calibratePosition(gridX, gridY) {
        // Store the grid point where user is standing
        this.originPoint = { x: gridX, y: gridY };
        
        try {
            // Get current AR.js camera position as world origin
            const camera = document.querySelector('a-entity[camera]');
            const position = camera.getAttribute('position');
            this.worldOrigin = { ...position };
            
            return true;
        } catch (error) {
            console.error('Calibration failed:', error);
            return false;
        }
    }

    async calibrateRotation() {
        return new Promise((resolve, reject) => {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS requires permission
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            this.setupOrientationListener(resolve);
                        } else {
                            reject(new Error('Permission denied'));
                        }
                    })
                    .catch(reject);
            } else {
                this.setupOrientationListener(resolve);
            }
        });
    }

    setupOrientationListener(callback) {
        const orientationHandler = (event) => {
            if (event.alpha !== null) {
                this.rotation = event.alpha;
                window.removeEventListener('deviceorientation', orientationHandler);
                callback();
            }
        };
        window.addEventListener('deviceorientation', orientationHandler);
    }

    setScale(realWorldMeters, gridUnits) {
        this.scale = realWorldMeters / gridUnits;
    }

    gridToWorld(gridX, gridY) {
        if (!this.originPoint || !this.worldOrigin) {
            throw new Error('Coordinate mapper not calibrated');
        }

        // Calculate relative grid coordinates from origin point
        const relativeX = gridX - this.originPoint.x;
        const relativeY = gridY - this.originPoint.y;

        // Convert to world coordinates (applying rotation and scale)
        const angleRad = (this.rotation * Math.PI) / 180;
        const worldX = this.worldOrigin.x + 
            (relativeX * Math.cos(angleRad) - relativeY * Math.sin(angleRad)) * this.scale;
        const worldZ = this.worldOrigin.z + 
            (relativeX * Math.sin(angleRad) + relativeY * Math.cos(angleRad)) * this.scale;

        return {
            x: worldX,
            y: this.worldOrigin.y, // Maintain same height as origin
            z: worldZ
        };
    }

    worldToGrid(worldX, worldY, worldZ) {
        if (!this.originPoint || !this.worldOrigin) {
            throw new Error('Coordinate mapper not calibrated');
        }

        // Calculate relative world coordinates
        const relativeX = worldX - this.worldOrigin.x;
        const relativeZ = worldZ - this.worldOrigin.z;

        // Inverse rotation and scale
        const angleRad = (-this.rotation * Math.PI) / 180;
        const gridX = this.originPoint.x + 
            (relativeX * Math.cos(angleRad) - relativeZ * Math.sin(angleRad)) / this.scale;
        const gridY = this.originPoint.y + 
            (relativeX * Math.sin(angleRad) + relativeZ * Math.cos(angleRad)) / this.scale;

        return { x: Math.round(gridX), y: Math.round(gridY) };
    }
} 