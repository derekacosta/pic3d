/**
 * Initialize vertex and fragment shaders
 * @param {!WebGL2RenderingContext2ect} gl rendering context
 * @param {string} vertexSource source code
 * @param {string} fragSource source code
 * 
 * @return {WebGLProgram} shaderProgram combined GPU program (vertex+frag)
 */
function initShaders(gl, vertexSource, fragSource) {
    // loads the source into gl context
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fragSource);

    // create shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('An error occurred during shader Linking...' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shaderProgram;
}

/**
 * 
 * @param {WebGL2RenderingContext2ect} gl webgl context
 * @param {number} type type of webgl shader (vertex or frag)
 * @param {string} source source code
 * 
 * @return {WebGLShader} shader newly created shader 
 */
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred during shader compiling...' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}