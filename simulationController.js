class SimulationController {
    constructor(arNavigator) {
        this.arNavigator = arNavigator;
        this.isSimulating = false;
        this.currentPath = [];
        this.currentPathIndex = 0;
        this.simulationSpeed = 0.5; // meters per second
        this.lastUpdateTime = 0;
        
        // Add simulation controls to UI
        this.addSimulationControls();
    }

    addSimulationControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1002;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            color: white;
        `;

        controlsContainer.innerHTML = `
            <div style="margin-bottom: 10px;">
                <label>Simulation Speed (m/s):
                    <input type="range" id="speedControl" min="0.1" max="2" step="0.1" value="0.5">
                    <span id="speedValue">0.5</span>
                </label>
            </div>
            <button id="startSimulation">Start Simulation</button>
            <button id="resetSimulation" disabled>Reset</button>
        `;

        document.body.appendChild(controlsContainer);

        // Add event listeners
        this.setupControlListeners(controlsContainer);
    }

    setupControlListeners(container) {
        const startBtn = container.querySelector('#startSimulation');
        const resetBtn = container.querySelector('#resetSimulation');
        const speedControl = container.querySelector('#speedControl');
        const speedValue = container.querySelector('#speedValue');

        startBtn.addEventListener('click', () => {
            if (!this.isSimulating) {
                this.startSimulation();
                startBtn.textContent = 'Stop Simulation';
                resetBtn.disabled = false;
            } else {
                this.stopSimulation();
                startBtn.textContent = 'Start Simulation';
            }
        });

        resetBtn.addEventListener('click', () => {
            this.resetSimulation();
            startBtn.textContent = 'Start Simulation';
            resetBtn.disabled = true;
        });

        speedControl.addEventListener('input', (e) => {
            this.simulationSpeed = parseFloat(e.target.value);
            speedValue.textContent = e.target.value;
        });
    }

    startSimulation() {
        if (!this.arNavigator.currentWaypoint) {
            console.error('No destination set for simulation');
            return;
        }

        this.isSimulating = true;
        this.currentPath = this.generatePath();
        this.currentPathIndex = 0;
        this.lastUpdateTime = performance.now();
        
        console.log('Simulation started');
        this.updateSimulation();
    }

    stopSimulation() {
        this.isSimulating = false;
    }

    resetSimulation() {
        this.stopSimulation();
        this.currentPathIndex = 0;
        this.updateUserPosition(this.currentPath[0]);
    }

    generatePath() {
        const path = [];
        const waypoints = this.arNavigator.floorPlanRenderer.waypoints;
        
        // Generate points between each waypoint
        for (let i = 0; i < waypoints.length - 1; i++) {
            const start = waypoints[i];
            const end = waypoints[i + 1];
            const points = this.interpolatePoints(
                this.gridToWorld(start),
                this.gridToWorld(end),
                0.1 // Point every 0.1 meters
            );
            path.push(...points);
        }
        
        return path;
    }

    gridToWorld(point) {
        return this.arNavigator.floorPlanRenderer.coordinateMapper.gridToWorld(point.x, point.y);
    }

    interpolatePoints(start, end, step) {
        const points = [];
        const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) +
            Math.pow(end.z - start.z, 2)
        );
        const steps = Math.ceil(distance / step);

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: start.x + (end.x - start.x) * t,
                y: start.y,
                z: start.z + (end.z - start.z) * t
            });
        }

        return points;
    }

    updateSimulation() {
        if (!this.isSimulating || this.currentPathIndex >= this.currentPath.length) {
            console.log('Simulation complete');
            return;
        }

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        // Move along path
        const distanceToMove = this.simulationSpeed * deltaTime;
        this.moveAlongPath(distanceToMove);

        // Continue simulation
        requestAnimationFrame(() => this.updateSimulation());
    }

    moveAlongPath(distance) {
        while (distance > 0 && this.currentPathIndex < this.currentPath.length - 1) {
            const currentPos = this.currentPath[this.currentPathIndex];
            const nextPos = this.currentPath[this.currentPathIndex + 1];
            
            const segmentDistance = Math.sqrt(
                Math.pow(nextPos.x - currentPos.x, 2) +
                Math.pow(nextPos.z - currentPos.z, 2)
            );

            if (distance >= segmentDistance) {
                // Move to next point
                this.currentPathIndex++;
                distance -= segmentDistance;
                this.updateUserPosition(nextPos);
            } else {
                // Interpolate position
                const t = distance / segmentDistance;
                const newPos = {
                    x: currentPos.x + (nextPos.x - currentPos.x) * t,
                    y: currentPos.y,
                    z: currentPos.z + (nextPos.z - currentPos.z) * t
                };
                this.updateUserPosition(newPos);
                break;
            }
        }

        if (this.currentPathIndex >= this.currentPath.length - 1) {
            this.stopSimulation();
        }

        // Add logging for position updates
        console.log('Current position:', this.userPosition);
    }

    updateUserPosition(position) {
        // Update AR Navigator's user position
        this.arNavigator.userPosition = position;
        
        // Update camera position in AR scene
        const camera = document.querySelector('a-entity[camera]');
        if (camera) {
            camera.setAttribute('position', position);
        }
    }

    startSimulationPath(start, end) {
        if (!start || !end) {
            console.error('Invalid start or end points for simulation');
            return;
        }

        this.isSimulating = true;
        this.currentPath = this.generatePathBetweenPoints(start, end);
        this.currentPathIndex = 0;
        this.lastUpdateTime = performance.now();
        
        console.log('Simulation started:', {
            from: start.objectName,
            to: end.objectName,
            pathLength: this.currentPath.length
        });
        
        this.updateSimulation();
    }

    generatePathBetweenPoints(start, end) {
        const points = this.interpolatePoints(
            { x: start.x, y: 0, z: start.y },
            { x: end.x, y: 0, z: end.y },
            0.1 // Point every 0.1 meters
        );
        return points;
    }
} 