// Variable initialisation
var canvas = document.querySelector('#canvas');
var context = canvas.getContext('2d');
var sizeIndicator = document.querySelector('#sizeIndicator');
var si = sizeIndicator.getContext('2d');
var linePoints = [];
var toolMode = 'brush';
var toolSize = 20;
var toolColor = '#000000';
var toolTexture = 'normal';
var stampSrc = '';
var stampImgUse = new Image();
var stampImgDisplay = new Image();
var canvasState = [];
var redoBuffer = [];
var undoButton = document.querySelector('[data-action=undo]');
var redoButton = document.querySelector('[data-action=redo]');
var lastPoint;

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
document.querySelector('#toolbar').addEventListener('click', selectTool);
window.addEventListener('mousemove', setToolColor);
window.addEventListener('mousemove', setToolSize);
document.querySelector('#dropdownTexture').addEventListener('click', setToolTexture);
document.querySelector('#dropdownStamp').addEventListener('click', setToolStamp);

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
        linePoints.push( {x: mouseX, y: mouseY, drag: mouseDrag, width: toolSize, color: toolColor, texture: toolTexture} );
        if (toolMode == 'brush' || toolMode == 'erase') {  
            if (toolMode == 'erase') {
                context.globalCompositeOperation = 'destination-out';
            } else {
                context.globalCompositeOperation = 'source-over';
            }
            if (toolTexture == 'normal') {
                context.lineJoin = "round";
                context.lineCap = "round";
                updateCanvas();
            }
            else if (toolTexture == 'brush') {
                textureBrush(mouseX,mouseY);
            } 
            else if (toolTexture == 'roller') {
                textureRoller(mouseX,mouseY);
            } 
            else if (toolTexture == 'spray') {
                textureSpray(mouseX,mouseY);
            } 
            else if (toolTexture == 'blur') {
                textureBlur(mouseX,mouseY);
            }
        }
        else if (toolMode == 'stamp') {
            placeStamp(mouseX,mouseY);
        }
    }
}

function stop(e) {
    if (e.which === 1 || e.type === 'touchend') {
        window.removeEventListener('mousemove', draw);
        window.removeEventListener('touchmove', draw);
        lastPoint = null;
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
            context.moveTo(linePoints[i].x, linePoints[i].y);
            context.lineTo(linePoints[i].x + 0.5, linePoints[i].y + 0.5);
        } else {
            context.lineTo(linePoints[i].x, linePoints[i].y);
        }
    }
    context.stroke();
}

function saveState() {
    canvasState.unshift(context.getImageData(0, 0, canvas.width, canvas.height));
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

function setToolColor() {
    if (document.getElementById("dropdownColor").classList.contains("show")) {
        toolColor = "rgb(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,")");
        document.getElementById("iconColor").style.color = toolColor;
        sizeIndicator.style.backgroundColor = toolColor;
    }
}

function setToolSize() {
    if (document.getElementById("dropdownSize").classList.contains("show")) {
        toolSize = document.getElementById("sizeSlider").value;
        setSISize();
    }
}

function setToolTexture(e) {
    toolTexture = e.target.dataset.texture || toolTexture;
    document.getElementById("iconTexture").className = e.target.classList;
    setSISize();
}

function setToolStamp(e) {
    stampSrc = e.target.dataset.stampsrc || stampSrc;
    stampImgUse.src = stampSrc;
    stampImgDisplay.src = stampSrc;
    setSISize();
}

function setSISize() {
    si.clearRect(0, 0, sizeIndicator.width, sizeIndicator.height);
    if (toolMode == 'brush' || toolMode == 'erase') {
        if (toolTexture == 'normal') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '50%'; 
            sizeIndicator.style.backgroundColor = toolColor;
        }
        else if (toolTexture == 'brush') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = (toolSize*2).toString().concat('px'); 
            sizeIndicator.style.borderRadius = '0%'; 
            sizeIndicator.style.backgroundColor = toolColor;
        }
        else if (toolTexture == 'roller') {
            sizeIndicator.style.width = (toolSize*4).toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '0%'; 
            sizeIndicator.style.backgroundColor = toolColor;
        }
        else if (toolTexture == 'spray') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '50%'; 
            sizeIndicator.style.backgroundColor = 'rgba(0,0,0,0)';
            var density = toolSize*100;
            for (var j = density; j--; ) {
                var angle = getRandomFloat(0, Math.PI*2);
                var radius = getRandomFloat(0, toolSize);
                si.fillStyle = toolColor;
                si.fillRect(200 + radius * Math.cos(angle), 200 + radius * Math.sin(angle), 1, 1);
            }
        }
        else if (toolTexture == 'blur') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '50%'; 
            sizeIndicator.style.backgroundColor = 'rgba(0,0,0,0)';
            var rgb = "rgba(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,",")
            var radgrad = context.createRadialGradient(200,200,100,200,200,200);
            radgrad.addColorStop(0, rgb.concat("0.4)"));
            radgrad.addColorStop(0.5, rgb.concat("0.2)"));
            radgrad.addColorStop(1, rgb.concat("0)"));
            si.fillStyle = radgrad;
            si.fillRect(0, 0, 400, 400);
        }
        else if (toolTexture == 'fur') {
            console.log('fur');
        }
    }
    else if (toolMode == 'stamp') {
        var imgWidth, imgHeight;
        if (Math.max(stampImgUse.width,stampImgUse.height) == stampImgUse.width) {
            imgWidth = toolSize;
            imgHeight = imgWidth * (stampImgUse.height / stampImgUse.width);
        } else {
            imgHeight = toolSize;
            imgWidth = imgHeight * (stampImgUse.width / stampImgUse.height);
        }
        sizeIndicator.style.width = imgWidth.toString().concat('px'); 
        sizeIndicator.style.height = imgHeight.toString().concat('px'); 
        sizeIndicator.style.borderRadius = '0%'; 
        sizeIndicator.style.backgroundColor = 'rgba(0,0,0,0)';
        si.drawImage(stampImgUse,0,0,400,400);
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function textureBrush(x,y) {
    var currentPoint = [x, y];
    if (lastPoint == null) {
        lastPoint = currentPoint;
    }
    var dist = distanceBetween(lastPoint, currentPoint);
    var angle = angleBetween(lastPoint, currentPoint);

    for (var j = 0; j < dist; j+=(toolSize/4)) {
        x = lastPoint[0] + (Math.sin(angle) * j);
        y = lastPoint[1] + (Math.cos(angle) * j);
        var rgb = "rgba(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,",")
        var radgrad = context.createRadialGradient(x,y,toolSize/2,x,y,toolSize);
        radgrad.addColorStop(0, rgb.concat("1)"));
        radgrad.addColorStop(0.5, rgb.concat("0.75)"));
        radgrad.addColorStop(1, rgb.concat("0.5)"));
        context.fillStyle = radgrad;
        context.lineJoin = "miter";
        context.lineCap = "butt";
        context.fillRect(x-(toolSize/2), y-toolSize, toolSize, toolSize*2);
    }
    lastPoint = currentPoint;
}

function textureRoller(x,y) {
    var currentPoint = [x, y];
    if (lastPoint == null) {
        lastPoint = currentPoint;
    }
    var dist = distanceBetween(lastPoint, currentPoint);
    var angle = angleBetween(lastPoint, currentPoint);

    for (var j = 0; j < dist; j+=(toolSize/4)) {
        x = lastPoint[0] + (Math.sin(angle) * j);
        y = lastPoint[1] + (Math.cos(angle) * j);
        var rgb = "rgba(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,",")
        var radgrad = context.createRadialGradient(x,y,toolSize,x,y,toolSize*2);
        radgrad.addColorStop(0, rgb.concat("1)"));
        radgrad.addColorStop(0.5, rgb.concat("0.75)"));
        radgrad.addColorStop(1, rgb.concat("0.5)"));
        context.fillStyle = radgrad;
        context.lineJoin = "miter";
        context.lineCap = "butt";
        context.fillRect(x-(toolSize*2), y-(toolSize/2), toolSize*4, toolSize);
    }
    lastPoint = currentPoint;
}

function textureSpray(x,y) {
    var density = toolSize*4;
    for (var j = density; j--; ) {
        var angle = getRandomFloat(0, Math.PI*2);
        var radius = getRandomFloat(0, toolSize/2);
        context.fillStyle = toolColor;
        context.fillRect(x + radius * Math.cos(angle), y + radius * Math.sin(angle), 1, 1);
    }
}

function textureBlur(x,y) {
    var currentPoint = [x, y];
    if (lastPoint == null) {
        lastPoint = currentPoint;
    }
    var dist = distanceBetween(lastPoint, currentPoint);
    var angle = angleBetween(lastPoint, currentPoint);
    var blurSize = toolSize / 2;
    for (var j = 0; j < dist; j+=(blurSize/4)) {
        x = lastPoint[0] + (Math.sin(angle) * j);
        y = lastPoint[1] + (Math.cos(angle) * j);
        var rgb = "rgba(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,",")
        var radgrad = context.createRadialGradient(x,y,blurSize/8,x,y,blurSize);
        radgrad.addColorStop(0, rgb.concat("0.4)"));
        radgrad.addColorStop(0.5, rgb.concat("0.2)"));
        radgrad.addColorStop(1, rgb.concat("0)"));
        context.fillStyle = radgrad;
        context.fillRect(x-blurSize, y-blurSize, blurSize*2, blurSize*2);
    }
    lastPoint = currentPoint;
}

function placeStamp(x,y) {
    var imgWidth, imgHeight;
    if (Math.max(stampImgUse.width,stampImgUse.height) == stampImgUse.width) {
        imgWidth = toolSize;
        imgHeight = imgWidth * (stampImgUse.height / stampImgUse.width);
    } else {
        imgHeight = toolSize;
        imgWidth = imgHeight * (stampImgUse.width / stampImgUse.height);
    }
    context.drawImage(stampImgUse,x-(imgWidth/2),y-(imgHeight/2),imgWidth,imgHeight);
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


