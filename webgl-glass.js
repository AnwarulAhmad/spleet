const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// 1. Updated with high-contrast colors to make refraction visible
const colorTop = new THREE.Color("rgb(100, 50, 150)");    // Bright Purple
const colorBottom = new THREE.Color("rgb(40, 180, 230)"); // Electric Blue

const material = new THREE.ShaderMaterial({
    uniforms: {
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

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
            return length(max(abs(p) - b + r, 0.0)) - r;
        }

        void main() {
            vec2 pixelPos = vec2(vUv.x * uResolution.x, (1.0 - vUv.y) * uResolution.y);
            vec2 glassCenter = uGlassPos + uGlassSize * 0.5;
            float d = roundedBoxSDF(pixelPos - glassCenter, uGlassSize * 0.5, uCornerRadius);
            vec2 bgUv = vUv;

            if (d < 0.0) {
                vec2 eps = vec2(1.0, 0.0);
                float dx = roundedBoxSDF(pixelPos - glassCenter + eps.xy, uGlassSize * 0.5, uCornerRadius) - 
                           roundedBoxSDF(pixelPos - glassCenter - eps.xy, uGlassSize * 0.5, uCornerRadius);
                float dy = roundedBoxSDF(pixelPos - glassCenter + eps.yx, uGlassSize * 0.5, uCornerRadius) - 
                           roundedBoxSDF(pixelPos - glassCenter - eps.yx, uGlassSize * 0.5, uCornerRadius);
                vec2 normal = normalize(vec2(dx, dy));

                float edgeThickness = 40.0; 
                float lensCurve = smoothstep(-edgeThickness, 0.0, d);
                
                // Increased refraction strength from 0.08 to 0.15 for better visibility
                bgUv += normal * lensCurve * 0.15; 
            }
            
            vec3 finalColor = mix(uColorBottom, uColorTop, bgUv.y);
            vec4 color = vec4(finalColor, 1.0);

            if (d < 0.0) {
                color.rgb += vec3(0.08); // Slight frost
                float highlight = smoothstep(-10.0, -3.0, d) * smoothstep(0.0, -3.0, d);
                color.rgb += highlight * vec3(0.6); // Edge shine
            }
            gl_FragColor = color;
        }
    `
});

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const glassBox = document.querySelector('.liquid-glass-box');

function updateGlassBounds() {
    if (glassBox) {
        const rect = glassBox.getBoundingClientRect();
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

function animate() {
    requestAnimationFrame(animate);
    updateGlassBounds(); 
    renderer.render(scene, camera);
}
animate();
