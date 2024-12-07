class FloorPlanRenderer {
    constructor(svgElement, gridSize = 50) {
        this.svg = svgElement;
        this.gridSize = gridSize;
        this.vertices = [];
        this.edges = [];
        this.scale = 0.2;  // Smaller scale to show more of the floor plan
        
        // Add calibration and interaction properties
        this.selectedCalibrationPoint = null;
        this.calibrationMarker = null;
        this.currentLocationSelect = document.getElementById('currentLocation');
        this.destinationSelect = document.getElementById('destination');
    }

    async loadFloorPlan(jsonUrl) {
        try {
            const response = await fetch(jsonUrl);
            const data = await response.json();
            this.vertices = data.vertices;
            this.edges = data.edges;
            this.render();
            this.populateDropdowns();
        } catch (error) {
            console.error('Error loading floor plan:', error);
        }
    }

    render() {
        // Clear existing content
        this.svg.innerHTML = '';
        
        // Calculate bounds for SVG sizing
        const bounds = this.calculateBounds();
        this.svg.setAttribute('viewBox', 
            `${bounds.minX * this.scale} ${bounds.minY * this.scale} ` +
            `${bounds.width * this.scale} ${bounds.height * this.scale}`
        );
        
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        
        // Draw grid
        this.drawGrid(bounds);
        
        // Draw paths (edges)
        this.drawPaths();
        
        // Draw vertices (waypoints)
        this.drawVertices();
    }

    calculateBounds() {
        const xCoords = this.vertices.map(v => v.cx);
        const yCoords = this.vertices.map(v => v.cy);
        
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        
        return {
            minX: minX - 50,
            maxX: maxX + 50,
            minY: minY - 50,
            maxY: maxY + 50,
            width: (maxX - minX) + 200,  // More padding
            height: (maxY - minY) + 200   // More padding
        };
    }

    drawGrid(bounds) {
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('class', 'grid');
        
        // Draw vertical lines
        for (let x = 0; x <= bounds.width; x += this.gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x * this.scale);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x * this.scale);
            line.setAttribute('y2', bounds.height * this.scale);
            line.setAttribute('stroke', CONFIG.gridColor);
            line.setAttribute('stroke-width', '0.5');
            gridGroup.appendChild(line);
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= bounds.height; y += this.gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y * this.scale);
            line.setAttribute('x2', bounds.width * this.scale);
            line.setAttribute('y2', y * this.scale);
            line.setAttribute('stroke', CONFIG.gridColor);
            line.setAttribute('stroke-width', '0.5');
            gridGroup.appendChild(line);
        }
        
        this.svg.appendChild(gridGroup);
    }

    drawVertices() {
        this.vertices.forEach(vertex => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', vertex.cx * this.scale);
            circle.setAttribute('cy', vertex.cy * this.scale);
            circle.setAttribute('r', 8);
            circle.setAttribute('class', 'waypoint');
            circle.setAttribute('data-id', vertex.id);
            circle.setAttribute('data-label', vertex.objectName);
            
            // Add label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', vertex.cx * this.scale + 15);
            text.setAttribute('y', vertex.cy * this.scale - 15);
            text.textContent = vertex.objectName;
            text.setAttribute('fill', 'black');
            text.setAttribute('font-size', '14px');
            text.setAttribute('font-weight', 'bold');
            
            this.svg.appendChild(circle);
            this.svg.appendChild(text);
        });
    }

    drawPaths() {
        this.edges.forEach(edge => {
            const fromVertex = this.vertices.find(v => v.id === edge.from);
            const toVertex = this.vertices.find(v => v.id === edge.to);
            
            if (fromVertex && toVertex) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const d = `M ${fromVertex.cx * this.scale} ${fromVertex.cy * this.scale} 
                          L ${toVertex.cx * this.scale} ${toVertex.cy * this.scale}`;
                path.setAttribute('d', d);
                path.setAttribute('class', 'path');
                path.setAttribute('data-id', edge.id);
                this.svg.appendChild(path);
            }
        });
    }

    getVertexById(id) {
        return this.vertices.find(v => v.id === id);
    }

    handleCalibrationClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const rect = this.svg.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Convert click coordinates to SVG coordinates
        const point = this.svg.createSVGPoint();
        point.x = clickX;
        point.y = clickY;
        
        // Get SVG transformation matrix
        const ctm = this.svg.getScreenCTM();
        const svgPoint = point.matrixTransform(ctm.inverse());
        
        // Find the closest vertex
        let closestVertex = null;
        let minDistance = Infinity;
        
        this.vertices.forEach(vertex => {
            const dx = vertex.cx - svgPoint.x / this.scale;
            const dy = vertex.cy - svgPoint.y / this.scale;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestVertex = vertex;
            }
        });
        
        if (closestVertex) {
            this.selectedCalibrationPoint = {
                id: closestVertex.id,
                objectName: closestVertex.objectName,
                x: closestVertex.cx,
                y: closestVertex.cy
            };
            
            // Show marker at selected vertex
            this.showCalibrationMarker(
                closestVertex.cx * this.scale,
                closestVertex.cy * this.scale
            );
            
            console.log('Selected calibration point:', this.selectedCalibrationPoint);
            return this.selectedCalibrationPoint;
        }
        
        return null;
    }

    showCalibrationMarker(x, y) {
        if (this.calibrationMarker) {
            this.calibrationMarker.remove();
        }

        this.calibrationMarker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create marker circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 10);
        circle.setAttribute('fill', '#00ff00');
        circle.setAttribute('stroke', '#008800');
        circle.setAttribute('stroke-width', '2');
        
        // Create pulse animation
        const pulseCircle = circle.cloneNode(true);
        pulseCircle.setAttribute('fill', 'none');
        pulseCircle.setAttribute('class', 'pulse');
        
        this.calibrationMarker.appendChild(circle);
        this.calibrationMarker.appendChild(pulseCircle);
        this.svg.appendChild(this.calibrationMarker);
    }

    highlightDestination(vertex) {
        // Remove any existing highlights
        this.clearHighlights();
        
        // Create highlight circle
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Outer circle (pulse animation)
        const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outerCircle.setAttribute('cx', vertex.cx * this.scale);
        outerCircle.setAttribute('cy', vertex.cy * this.scale);
        outerCircle.setAttribute('r', 15);
        outerCircle.setAttribute('class', 'destination-highlight pulse');
        outerCircle.setAttribute('fill', 'none');
        outerCircle.setAttribute('stroke', '#ff0000');
        outerCircle.setAttribute('stroke-width', '2');

        // Inner circle (solid)
        const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        innerCircle.setAttribute('cx', vertex.cx * this.scale);
        innerCircle.setAttribute('cy', vertex.cy * this.scale);
        innerCircle.setAttribute('r', 8);
        innerCircle.setAttribute('fill', '#ff0000');

        highlight.appendChild(outerCircle);
        highlight.appendChild(innerCircle);
        this.svg.appendChild(highlight);
        
        console.log('Destination highlighted:', vertex);
    }

    clearHighlights() {
        const highlights = this.svg.querySelectorAll('.destination-highlight');
        highlights.forEach(h => h.remove());
    }

    findClosestVertex(x, y) {
        let closestVertex = null;
        let minDistance = Infinity;
        
        this.vertices.forEach(vertex => {
            const dx = vertex.cx - x;
            const dy = vertex.cy - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestVertex = vertex;
            }
        });
        
        return closestVertex;
    }

    populateDropdowns() {
        // Clear existing options except the first one
        while (this.currentLocationSelect.options.length > 1) {
            this.currentLocationSelect.remove(1);
        }
        while (this.destinationSelect.options.length > 1) {
            this.destinationSelect.remove(1);
        }

        // Add vertices to dropdowns
        this.vertices.forEach(vertex => {
            const option = new Option(vertex.objectName, vertex.id);
            const destOption = new Option(vertex.objectName, vertex.id);
            
            this.currentLocationSelect.add(option);
            this.destinationSelect.add(destOption);
        });
    }

    generatePathBetweenPoints(start, end) {
        // Find path through waypoints
        const path = this.findShortestPath(start, end);
        const points = [];
        
        // Generate points along each segment
        for (let i = 0; i < path.length - 1; i++) {
            const pointsInSegment = this.interpolatePoints(
                { x: path[i].cx, y: 0, z: path[i].cy },
                { x: path[i + 1].cx, y: 0, z: path[i + 1].cy },
                0.1
            );
            points.push(...pointsInSegment);
        }
        
        return points;
    }

    findShortestPath(start, end) {
        // Use vertices and edges to find the shortest path
        const path = [];
        const visited = new Set();
        const queue = [{ vertex: start, path: [start] }];
        
        while (queue.length > 0) {
            const { vertex, path } = queue.shift();
            
            if (vertex.id === end.id) {
                return path;
            }
            
            if (!visited.has(vertex.id)) {
                visited.add(vertex.id);
                
                // Find connected vertices through edges
                const edges = this.edges.filter(e => e.from === vertex.id || e.to === vertex.id);
                for (const edge of edges) {
                    const nextId = edge.from === vertex.id ? edge.to : edge.from;
                    const nextVertex = this.vertices.find(v => v.id === nextId);
                    if (!visited.has(nextId)) {
                        queue.push({ vertex: nextVertex, path: [...path, nextVertex] });
                    }
                }
            }
        }
        
        return [start, end]; // Fallback to direct path if no route found
    }
}

// Initialize the floor plan renderer
document.addEventListener('DOMContentLoaded', () => {
    const svg = document.getElementById('floorPlan');
    const renderer = new FloorPlanRenderer(svg);
    renderer.loadFloorPlan('floorPlan.json');
});