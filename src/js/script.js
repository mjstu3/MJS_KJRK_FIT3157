// Variable initialisation
var canvas = document.querySelector('#canvas');
var context = canvas.getContext('2d');
var linePoints = [];
var toolMode = 'draw';
var toolSize = 20;
var toolColor = '#000000';
var brushType = 'normal';
var canvasState = [];
var redoBuffer = [];
var undoButton = document.querySelector('[data-action=undo]');
var redoButton = document.querySelector('[data-action=redo]');

// Defaults
context.strokeStyle = "#000000";
context.lineWidth = 20;
context.lineJoin = "round";
context.lineCap = "round";

// Event listeners
canvas.addEventListener('mousedown', draw);
canvas.addEventListener('touchstart', draw);
window.addEventListener('mouseup', stop);
window.addEventListener('touchend', stop);
window.addEventListener('mousemove', setColor);
window.addEventListener('mousemove', setSize);
document.querySelector('#toolbar').addEventListener('click', selectTool);
document.querySelector('#dropdownTexture').addEventListener('click', selectTexture);

// Functions
function clearCanvas() {
    var result = confirm( 'Are you sure you want to delete the picture?' );
    if (result) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvasState.length = 0;
        undoButton.classList.add('disabled');
    }
}

function draw(e) {
    if (e.which === 1 || e.type === 'touchstart' || e.type === 'touchmove') {
        window.addEventListener('mousemove', draw);
        window.addEventListener('touchmove', draw);
        var mouseX = e.pageX - canvas.offsetLeft;
        var mouseY = e.pageY - canvas.offsetTop;
        var mouseDrag = e.type === 'mousemove';
        if (e.type === 'touchstart' || e.type === 'touchmove') {
            mouseX = e.touches[0].pageX - canvas.offsetLeft;
            mouseY = e.touches[0].pageY - canvas.offsetTop;
            mouseDrag = e.type === 'touchmove';
        }
        if (e.type === 'mousedown' || e.type === 'touchstart') saveState();
        linePoints.push( {x: mouseX, y: mouseY, drag: mouseDrag, width: toolSize, color: toolColor, texture: brushType} );
        updateCanvas();
    }
}

function stop(e) {
    if (e.which === 1 || e.type === 'touchend') {
        window.removeEventListener('mousemove', draw);
        window.removeEventListener('touchmove', draw);
    }
}

function updateCanvas() {
    context.clearRect( 0, 0, canvas.width, canvas.height );
    context.putImageData( canvasState[0], 0, 0 );
    renderLine();
}

function renderLine() {
    for ( var i = 0, length = linePoints.length; i < length; i++ ) {
        if ( !linePoints[i].drag ) {
            //context.stroke();
            context.beginPath();
            context.lineWidth = linePoints[i].width;
            context.strokeStyle = linePoints[i].color;
            if (linePoints[i].texture == 'blur') {
                textureBlur(i);
            }
            if (linePoints[i].texture == 'spray') {
                textureSpray(i);
            } else {
                context.moveTo( linePoints[i].x, linePoints[i].y );
                context.lineTo( linePoints[i].x + 0.5, linePoints[i].y + 0.5 );
            }
        } else {
            if (linePoints[i].texture == 'blur') {
                textureBlur(i);
            }
            if (linePoints[i].texture == 'spray') {
                textureSpray(i);
            } else {
                context.lineTo( linePoints[i].x, linePoints[i].y );
            }
        }
    }

    if ( toolMode === 'erase' ) {
        context.globalCompositeOperation = 'destination-out';
    } else {
        context.globalCompositeOperation = 'source-over';
    }
    context.lineWidth = toolSize;
    context.stroke();
}

function saveState() {
    canvasState.unshift( context.getImageData( 0, 0, canvas.width, canvas.height ) );
    linePoints = [];
    if ( canvasState.length > 25 ) canvasState.length = 25;
    redoBuffer = [];
}

function undoState() {
    if (canvasState.length > 0) {
        saveRedo();
        context.putImageData( canvasState.shift(), 0, 0 );
    }
}

function saveRedo() {
    redoBuffer.unshift( context.getImageData( 0, 0, canvas.width, canvas.height ) );
    console.log(redoBuffer[0]);
    linePoints = [];
    if ( canvasState.length > 25 ) canvasState.length = 25;
}

function redoState() {
    if (redoBuffer.length > 0) {
        canvasState.unshift( context.getImageData( 0, 0, canvas.width, canvas.height ) );
        context.putImageData( redoBuffer.shift(), 0, 0 );
        linePoints = [];
        if ( canvasState.length > 25 ) canvasState.length = 25;
    }
}

function selectTool(e) {
    if (e.target === e.currentTarget) return;
    if (e.target.dataset.mode) highlightButton(e.target);
    toolSize = e.target.dataset.size || toolSize;
    toolMode = e.target.dataset.mode || toolMode;
    toolColor = e.target.dataset.color || toolColor;
    if (e.target === undoButton) undoState();
    if (e.target === redoButton) redoState();
    if (e.target.dataset.action == 'delete') clearCanvas();
}

function selectTexture(e) {
    brushType = e.target.dataset.texture || brushType;
    document.getElementById("iconTexture").className = e.target.classList;
}

function highlightButton(button) {
    var buttons = button.parentNode.parentNode.querySelectorAll('div');
    buttons.forEach(function(element){ element.classList.remove('active')});
    button.parentNode.classList.add('active');
}

function toggleColors() {
    document.getElementById("dropdownColor").classList.toggle("show");
    closeOtherDropdowns("dropdownColor");
}

function toggleSize() {
    document.getElementById("dropdownSize").classList.toggle("show");
    closeOtherDropdowns("dropdownSize");
}

function toggleTexture() {
    document.getElementById("dropdownTexture").classList.toggle("show");
    closeOtherDropdowns("dropdownTexture");
}

function toggleStamp() {
    document.getElementById("dropdownStamp").classList.toggle("show");
    closeOtherDropdowns("dropdownStamp");
}

function closeOtherDropdowns(current) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show') && openDropdown.id !== current) {
            openDropdown.classList.toggle('show');
        }
    }
}

window.onmousedown = function(event) {
    if (!event.target.matches('.icon') && !event.target.matches('.dropdown-content') && !event.target.matches('.size-slider') && !event.target.matches('.size-indicator')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.toggle('show');
            }
        }
    }
}

function setColor() {
    if (document.getElementById("dropdownColor").classList.contains("show")) {
        toolColor = "rgb(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,")");
        document.getElementById("iconColor").style.color = toolColor;
        document.getElementById("sizeIndicator").style.backgroundColor = toolColor;
    }
}

function setSize() {
    if (document.getElementById("dropdownSize").classList.contains("show")) {
        toolSize = document.getElementById("sizeSlider").value;
        document.getElementById("sizeIndicator").style.height = toolSize.concat('px');
        document.getElementById("sizeIndicator").style.width = toolSize.concat('px');
    }
}

function distanceBetween(p1, p2) {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

function angleBetween(p1, p2) {
    return Math.atan2( p2[0] - p1[0], p2[1] - p1[1] );
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function textureBlur(i) {
    var x = linePoints[i].x;
    var y = linePoints[i].y;
    var currentPoint = [x, y];
    var lastPoint;
    if (linePoints[i-1] == null) {
        lastPoint = currentPoint;
    } else {
        lastPoint = [linePoints[i-1].x, linePoints[i-1].y];
    }
    var dist = distanceBetween(lastPoint, currentPoint);
    var angle = angleBetween(lastPoint, currentPoint);

    for (var j = 0; j < dist; j+=8) {
        x = lastPoint[0] + (Math.sin(angle) * j);
        y = lastPoint[1] + (Math.cos(angle) * j);
        var radgrad = context.createRadialGradient(x,y,toolSize/2,x,y,toolSize);
        radgrad.addColorStop(0, toolColor);
        radgrad.addColorStop(0.5, "rgba(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,",0.5)"));
        radgrad.addColorStop(1, "rgba(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,",0)"));
        context.fillStyle = radgrad;
        context.fillRect(x-toolSize, y-toolSize, toolSize*2, toolSize*2);
    }
}

function textureSpray(i) {
    var x = linePoints[i].x;
    var y = linePoints[i].y;
    var density = toolSize*2;
    for (var j = density; j--; ) {
        var angle = getRandomFloat(0, Math.PI*2);
        var radius = getRandomFloat(0, toolSize);
        context.fillStyle = toolColor;
        context.fillRect(x + radius * Math.cos(angle), y + radius * Math.sin(angle), 1, 1);
    }
}

// jquery for spectrum color tool

$(function(){

    $("#colorpicker").spectrum({
        color: "black",
        flat: true,
        showButtons: false,
        containerClassName: 'palette'
    });
    $(".sp-picker-container").width(400);

    $("#colorpicker").spectrum("set", "black");
    
    
});


