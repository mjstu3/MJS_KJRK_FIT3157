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
window.addEventListener('touchmove', setToolColor);
window.addEventListener('mousemove', setToolSize);
window.addEventListener('touchmove', setToolSize);
document.querySelector('#dropdownTexture').addEventListener('click', setToolTexture);
document.querySelector('#dropdownStamp').addEventListener('click', setToolStamp);
setSISize()

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
            else if (toolTexture == 'cross') {
                textureCross(mouseX,mouseY);
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
    si.lineJoin = "round";
    si.lineCap = "round";
    var x = 300;
    var y = 300;
    var ts = 600;
    if (toolMode == 'brush' || toolMode == 'erase') {
        if (toolTexture == 'normal') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '50%'; 
            sizeIndicator.style.backgroundColor = toolColor;
        }
        else if (toolTexture == 'brush') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '0%'; 
            sizeIndicator.style.backgroundColor = 'rgba(0,0,0,0)';
            si.strokeStyle = toolColor;
            si.fillStyle = toolColor;
            var radius = ts * 0.025;
            si.strokeRect(x+(radius/2)-(ts/4), y+(radius/2)-(ts/2), (ts/2)-radius, ts-radius);
            si.fillRect(x+(radius/2)-(ts/4), y+(radius/2)-(ts/2), (ts/2)-radius, ts-radius);
        }
        else if (toolTexture == 'roller') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '0%'; 
            sizeIndicator.style.backgroundColor = 'rgba(0,0,0,0)';
            si.strokeStyle = toolColor;
            si.fillStyle = toolColor;
            var radius = ts * 0.025;
            si.strokeRect(x+(radius/2)-(ts/2), y+(radius/2)-(ts/8), ts-radius, (ts/4)-radius);
            si.fillRect(x+(radius/2)-(ts/2), y+(radius/2)-(ts/8), ts-radius, (ts/4)-radius);
        }
        else if (toolTexture == 'spray') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '50%'; 
            sizeIndicator.style.backgroundColor = 'rgba(0,0,0,0)';
            var density = ts*100;
            for (var j = density; j--; ) {
                var angle = getRandomFloat(0, Math.PI*2);
                var radius = getRandomFloat(0, ts*3);
                si.fillStyle = toolColor;
                si.fillRect(x + radius * Math.cos(angle), y + radius * Math.sin(angle), 1, 1);
            }
        }
        else if (toolTexture == 'blur') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '50%'; 
            sizeIndicator.style.backgroundColor = 'rgba(0,0,0,0)';
            var rgb = "rgba(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,",")
            var radgrad = si.createRadialGradient(x,y,(ts/4),x,y,(ts/2));
            radgrad.addColorStop(0, rgb.concat("0.4)"));
            radgrad.addColorStop(0.5, rgb.concat("0.2)"));
            radgrad.addColorStop(1, rgb.concat("0)"));
            si.fillStyle = radgrad;
            si.fillRect(0, 0, ts, ts);
        }
        else if (toolTexture == 'cross') {
            sizeIndicator.style.width = toolSize.toString().concat('px'); 
            sizeIndicator.style.height = toolSize.toString().concat('px'); 
            sizeIndicator.style.borderRadius = '0%'; 
            sizeIndicator.style.backgroundColor = 'rgba(0,0,0,0)';
            si.fillStyle = toolColor;
            si.fillRect(x-(ts/2)-(ts/32), y+(ts/8)-(ts/16), ts, ts/16);
            si.fillRect(x-(ts/2)-(ts/32), y-(ts/8)-(ts/16), ts, ts/16);
            si.fillRect(x+(ts/8)-(ts/16), y-(ts/2)-(ts/32), ts/16, ts);
            si.fillRect(x-(ts/8)-(ts/16), y-(ts/2)-(ts/32), ts/16, ts);
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
        si.drawImage(stampImgUse,0,0,ts,ts);
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

    for (var j = 0; j < dist; j+=5) {
        x = lastPoint[0] + (Math.sin(angle) * j);
        y = lastPoint[1] + (Math.cos(angle) * j);
        context.strokeStyle = toolColor;
        context.fillStyle = toolColor;
        var radius = toolSize * 0.025;
        context.strokeRect(x+(radius/2)-(toolSize/4), y+(radius/2)-(toolSize/2), (toolSize/2)-radius, toolSize-radius);
        context.fillRect(x+(radius/2)-(toolSize/4), y+(radius/2)-(toolSize/2), (toolSize/2)-radius, toolSize-radius);
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

    for (var j = 0; j < dist; j+=5) {
        x = lastPoint[0] + (Math.sin(angle) * j);
        y = lastPoint[1] + (Math.cos(angle) * j);
        context.strokeStyle = toolColor;
        context.fillStyle = toolColor;
        var radius = toolSize * 0.025;
        context.strokeRect(x+(radius/2)-(toolSize/2), y+(radius/2)-(toolSize/8), toolSize-radius, (toolSize/4)-radius);
        context.fillRect(x+(radius/2)-(toolSize/2), y+(radius/2)-(toolSize/8), toolSize-radius, (toolSize/4)-radius);
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
    for (var j = 0; j < dist; j+=5) {
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

function textureCross(x,y) {
    var currentPoint = [x, y];
    if (lastPoint == null) {
        lastPoint = currentPoint;
    }
    var dist = distanceBetween(lastPoint, currentPoint);
    var angle = angleBetween(lastPoint, currentPoint);
    for (var j = 0; j < dist; j+=1) {
        x = lastPoint[0] + (Math.sin(angle) * j);
        y = lastPoint[1] + (Math.cos(angle) * j);
        context.fillStyle = toolColor;
        context.fillRect(x-(toolSize/2)-(toolSize/32), y+(toolSize/8)-(toolSize/16), toolSize, toolSize/16);
        context.fillRect(x-(toolSize/2)-(toolSize/32), y-(toolSize/8)-(toolSize/16), toolSize, toolSize/16);
        context.fillRect(x+(toolSize/8)-(toolSize/16), y-(toolSize/2)-(toolSize/32), toolSize/16, toolSize);
        context.fillRect(x-(toolSize/8)-(toolSize/16), y-(toolSize/2)-(toolSize/32), toolSize/16, toolSize);
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


