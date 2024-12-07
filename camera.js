class CameraHandler {
    constructor() {
        this.videoElement = document.getElementById('cameraFeed');
        this.errorElement = document.getElementById('cameraError');
        this.stream = null;
    }

    async initializeCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment', // Prefer rear camera on mobile devices
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            this.errorElement.style.display = 'none';
            
            // Handle video loading
            this.videoElement.onloadedmetadata = () => {
                this.videoElement.play();
            };

        } catch (error) {
            console.error('Error accessing camera:', error);
            this.errorElement.style.display = 'block';
            this.errorElement.textContent = `Camera error: ${error.message}`;
        }
    }

    stopCamera() {
        if (this.stream) {
            const tracks = this.stream.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
            this.stream = null;
        }
    }

    // Switch between front and rear cameras (mobile devices)
    async switchCamera() {
        const currentFacingMode = this.getCurrentFacingMode();
        this.stopCamera();
        
        try {
            const constraints = {
                video: {
                    facingMode: currentFacingMode === 'environment' ? 'user' : 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
        } catch (error) {
            console.error('Error switching camera:', error);
            this.errorElement.style.display = 'block';
        }
    }

    getCurrentFacingMode() {
        if (!this.stream) return null;
        const videoTrack = this.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        return settings.facingMode;
    }
}

// Initialize camera when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const camera = new CameraHandler();
    camera.initializeCamera();

    // Clean up when the page is closed or refreshed
    window.addEventListener('beforeunload', () => {
        camera.stopCamera();
    });
}); 