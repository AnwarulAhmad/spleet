const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// 1. Set your Gradient Colors here (using the colors from your CSS!)
const colorTop = new THREE.Color("rgb(16, 0, 31)");
const colorBottom = new THREE.Color("rgb(47, 39, 54)");

// The Core WebGL Refraction Shader
const material = new THREE.ShaderMaterial({
    uniforms: {
        // Pass the colors to the GPU instead of an image texture
        uColorTop: { value: colorTop },
        uColorBottom: { value: colorBottom },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uGlassPos: { value: new THREE.Vector2(0, 0) },
        uGlassSize: { value: new THREE.Vector2(0, 0) },
        uCornerRadius: { value: 32.0 } 
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;
        uniform vec2 uResolution;
        uniform vec2 uGlassPos;
        uniform vec2 uGlassSize;
        uniform float uCornerRadius;
        
        varying vec2 vUv;

        // Math formula to draw the glass boundaries
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
            return length(max(abs(p) - b + r, 0.0)) - r;
        }

        void main() {
            // Map UVs to the actual screen pixels
            vec2 pixelPos = vec2(vUv.x * uResolution.x, (1.0 - vUv.y) * uResolution.y);
            vec2 glassCenter = uGlassPos + uGlassSize * 0.5;
            
            float d = roundedBoxSDF(pixelPos - glassCenter, uGlassSize * 0.5, uCornerRadius);
            
            // Base coordinates for the gradient
            vec2 bgUv = vUv;

            // If we are inside the HTML div boundaries... apply liquid physics!
            if (d < 0.0) {
                // Calculate edge slopes
                vec2 eps = vec2(1.0, 0.0);
                float dx = roundedBoxSDF(pixelPos - glassCenter + eps.xy, uGlassSize * 0.5, uCornerRadius) - 
                           roundedBoxSDF(pixelPos - glassCenter - eps.xy, uGlassSize * 0.5, uCornerRadius);
                float dy = roundedBoxSDF(pixelPos - glassCenter + eps.yx, uGlassSize * 0.5, uCornerRadius) - 
                           roundedBoxSDF(pixelPos - glassCenter - eps.yx, uGlassSize * 0.5, uCornerRadius);
                vec2 normal = normalize(vec2(dx, dy));

                // Thick Edge Refraction Lens
                float edgeThickness = 40.0; 
                float lensCurve = smoothstep(-edgeThickness, 0.0, d);
                
                // Bend the coordinates to create the refraction
                bgUv += normal * lensCurve * 0.08; 
            }
            
            // 2. MIX THE GRADIENT! 
            // This mathematically blends the bottom color into the top color based on the screen height.
            vec3 finalColor = mix(uColorBottom, uColorTop, bgUv.y);
            vec4 color = vec4(finalColor, 1.0);

            // Add the physical glass styling (frost and highlights)
            if (d < 0.0) {
                // Glass frosted tint
                color.rgb += vec3(0.05);

                // Add physical shiny specular highlight to the inner curved edge
                float highlight = smoothstep(-10.0, -3.0, d) * smoothstep(0.0, -3.0, d);
                color.rgb += highlight * vec3(0.6); 
            }
            
            gl_FragColor = color;
        }
    `
});

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Sync the HTML DOM div to the WebGL Shader
const glassBox = document.querySelector('.liquid-glass-box');

function updateGlassBounds() {
    if (glassBox) {
        const rect = glassBox.getBoundingClientRect();
        // Pass exact on-screen coordinates to the GPU
        material.uniforms.uGlassPos.value.set(rect.left, rect.top);
        material.uniforms.uGlassSize.value.set(rect.width, rect.height);
    }
}

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    updateGlassBounds();
}
window.addEventListener('resize', resize);
resize();

// 60FPS Render Loop
function animate() {
    requestAnimationFrame(animate);
    updateGlassBounds(); 
    renderer.render(scene, camera);
}
animate();
