// Variable initialisation
var canvas = document.querySelector('#canvas');
var context = canvas.getContext('2d');
var sizeIndicator = document.querySelector('#sizeIndicator');
var si = sizeIndicator.getContext('2d');
var linePoints = [];
var toolMode = 'brush';
var toolSize = 50;
var toolOpacity = 1;
var toolColor = '#000000';
var toolTexture = 'normal';
var stampSrc = '';
var stampImgUse = new Image();
var stampImgDisplay = new Image();
var stampSelected = 'A';
var canvasState = [];
var redoBuffer = [];
var lastPoint;

// Defaults
context.strokeStyle = toolColor;
context.lineWidth = toolSize;
context.lineJoin = "round";
context.lineCap = "round";
context.globalAlpha = 1;
context.globalCompositionOperation = "source-over";
setSISize();

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
window.addEventListener('mousemove', setToolOpacity);
window.addEventListener('touchmove', setToolOpacity);
window.addEventListener('mousedown', closeAllDropdowns);
window.addEventListener('touchstart', closeAllDropdowns);
document.querySelector('#dropdownTexture').addEventListener('click', setToolTexture);
document.querySelector('#dropdownStamp').addEventListener('click', setToolStamp);
document.querySelector('#dropdownChar').addEventListener('click', closeStampsDropdown);
document.querySelector('#dropdownShape').addEventListener('click', closeStampsDropdown);
document.querySelector('#dropdownFlag').addEventListener('click', closeStampsDropdown);

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
        if (toolMode == 'brush' || toolMode == 'erase') {  
            if (toolMode == 'erase') {
                context.globalCompositeOperation = 'destination-out';
            } else {
                context.globalCompositeOperation = 'source-over';
            }
            if (toolTexture == 'normal') {
                textureNormal(mouseX,mouseY,context,toolSize,mouseDrag);
            }
            else if (toolTexture == 'brush') {
                textureBrush(mouseX,mouseY,context,toolSize,mouseDrag);
            } 
            else if (toolTexture == 'roller') {
                textureRoller(mouseX,mouseY,context,toolSize,mouseDrag);
            } 
            else if (toolTexture == 'spray') {
                textureSpray(mouseX,mouseY,context,toolSize);
            } 
            else if (toolTexture == 'blur') {
                textureBlur(mouseX,mouseY,context,toolSize,mouseDrag);
            }
        }
        else if (toolMode == 'stamp' && e.type !== 'touchmove' && e.type !== 'mousemove') {
            context.globalCompositeOperation = 'source-over';
            if (stampSelected.length == 1) {
                placeText(mouseX,mouseY,context,toolSize);
            }
            else if (stampSelected == 'square') {
                placeSquare(mouseX,mouseY,context,toolSize);
            }
            else if (stampSelected == 'star5') {
                placeStar(mouseX,mouseY,context,toolSize,5);
            }
            else if (stampSelected == 'star9') {
                placeStar(mouseX,mouseY,context,toolSize,9);
            }
            else if (stampSelected == 'hash') {
                placeHash(mouseX,mouseY,context,toolSize);
            }
            else if (stampSelected == 'flag') {
                placeFlag(mouseX,mouseY,context,toolSize);
            }
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

function saveCanvas() {
    document.getElementById("save").href = canvas.toDataURL('image/png');
}

function selectTool(e) {
    if (e.target === e.currentTarget) return;
    if (e.target.dataset.mode) highlightButton(e.target);
    toolMode = e.target.dataset.mode || toolMode;
    stampSelected = e.target.dataset.stamp || stampSelected;
    stampSrc = e.target.dataset.stampsrc || stampSrc;
    if (e.target.dataset.action == 'undo') undoState();
    if (e.target.dataset.action == 'redo') redoState();
    if (e.target.dataset.action == 'delete') clearCanvas();
    if (e.target.dataset.action == 'save') saveCanvas();
}

function highlightButton(button) {
    var buttons = button.parentNode.parentNode.querySelectorAll('div');
    buttons.forEach(function(element){ element.classList.remove('active')});
    button.parentNode.classList.add('active');
}

function toggleDropdown(e) {
    e.parentNode.childNodes[3].classList.toggle("show");
    closeOtherDropdowns(e.parentNode.childNodes[3].id, "child");
    closeOtherDropdowns(e.parentNode.childNodes[3].id, "normal");
}

function toggleChildDropdown(e) {
    var dropdownID;
    if (e.id == "iconChar") {
        dropdownID = "dropdownChar";
    }
    else if (e.id == "iconShape") {
        dropdownID = "dropdownShape";
    }
    else if (e.id == "iconFlag") {
        dropdownID = "dropdownFlag";
    }
    document.getElementById(dropdownID).classList.toggle("show");
    closeOtherDropdowns(dropdownID, "child");
}

function closeOtherDropdowns(current, type) {
    var dropdowns, i;
    if (type === "normal") {
        dropdowns = document.getElementsByClassName("dropdown-content");
    }
    else if ( type === "child") {
        dropdowns = document.getElementsByClassName("dropdown-child");
    } else {
        closeOtherDropdowns(current, "child");
        closeOtherDropdowns(current, "normal");
    }
    if (dropdowns != null) {
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show') && openDropdown.id !== current) {
                openDropdown.classList.toggle('show');
            }
        }
    }
}

function closeAllDropdowns(e) {
    var t = e.target;
    while(t) {
        if (t.classList != null) {
            var i;
            for (i = 0; i < t.classList.length; i++) {
                if (t.classList[i] === "dropdown-content") {
                    return;
                }
            }
        }
        t = t.parentNode;
    }
    if (e.target.classList.contains('dropdown-icon')) {
        closeOtherDropdowns(e.target.parentNode.childNodes[3].id, null);
    } else {
        closeOtherDropdowns(null,null);
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
    document.getElementById("iconTexture").classList.add("dropdown-icon");
    setSISize();
    closeOtherDropdowns(null,null);
}

function setToolOpacity() {
    if (document.getElementById("dropdownOpacity").classList.contains("show")) {
        toolOpacity = document.getElementById("opacitySlider").value;
        toolOpacity = toolOpacity/100;
        document.getElementById("opacityText").textContent="Opacity: " + Math.round(toolOpacity * 100) + "%";
        setSISize();
    }
}

function setToolStamp(e) {
    stampSrc = e.target.dataset.stampsrc || stampSrc;
    stampImgUse.src = stampSrc;
    stampImgDisplay.src = stampSrc;
    setSISize();
}

function closeStampsDropdown() {
    closeOtherDropdowns(null,null);
}

function setSISize() {
    si.clearRect(0, 0, sizeIndicator.width, sizeIndicator.height);
    si.lineJoin = "round";
    si.lineCap = "round";
    si.globalAlpha = toolOpacity;
    sizeIndicator.style.width = toolSize.toString().concat('px'); 
    sizeIndicator.style.height = toolSize.toString().concat('px'); 
    sizeIndicator.style.backgroundColor = 'rgba(0,0,0,0)';
    var x = 300;
    var y = 300;
    var ts = 600;
    si.lineWidth = ts;
    var radius;
    if (toolMode == 'brush' || toolMode == 'erase') {
        if (toolTexture == 'normal') {
            textureNormal(x,y,si,ts,false);
        }
        else if (toolTexture == 'brush') {
            textureBrush(x,y,si,ts,false);
        }
        else if (toolTexture == 'roller') {
            textureRoller(x,y,si,ts,false);
        }
        else if (toolTexture == 'spray') {
            textureSpray(x,y,si,ts);
        }
        else if (toolTexture == 'blur') {
            textureBlur(x,y,si,ts,false);
        }
    }
    else if (toolMode == 'stamp') {
        if (stampSelected.length == 1) {
            placeText(x,y,si,ts);
        }
        else if (stampSelected == 'square') {
            placeSquare(x,y,si,ts);
        }
        else if (stampSelected == 'star5') {
            placeStar(x,y,si,ts,5);
        }
        else if (stampSelected == 'star9') {
            placeStar(x,y,si,ts,9);
        }
        else if (stampSelected == 'hash') {
            placeHash(x,y,si,ts);
        }
        else if (stampSelected == 'flag') {
            placeFlag(x,y,si,ts);
        }
    }
}

function distanceBetween(p1, p2) {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

function angleBetween(p1, p2) {
    return Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function textureNormal(x,y,ctx,ts,drag) {
    ctx.fillStyle = toolColor;
    ctx.lineWidth = ts;
    ctx.globalAlpha = toolOpacity/5;
    if (!drag) {
        ctx.beginPath();
        ctx.arc(x,y,ts/2, 0, Math.PI*2); 
        ctx.closePath();
        ctx.fill();
    } else {
        var currentPoint = [x, y];
        if (lastPoint == null) {
            lastPoint = currentPoint;
        }
        var dist = distanceBetween(lastPoint, currentPoint);
        var angle = angleBetween(lastPoint, currentPoint);
        for (var j = 0; j < dist; j+=1) {
            x = lastPoint[0] + (Math.sin(angle) * j);
            y = lastPoint[1] + (Math.cos(angle) * j);
            ctx.beginPath();
            ctx.arc(x,y,ts/2, 0, Math.PI*2); 
            ctx.closePath();
            ctx.fill();
        }
        lastPoint = currentPoint;
    }
}

function textureBrush(x,y,ctx,ts,drag) {
    ctx.fillStyle = toolColor;
    ctx.lineWidth = ts;
    ctx.globalAlpha = toolOpacity/5;
    if (!drag) {
        ctx.fillRect(x-(ts/4), y-(ts/2), ts/2, ts);
    } else {
        var currentPoint = [x, y];
        if (lastPoint == null) {
            lastPoint = currentPoint;
        }
        var dist = distanceBetween(lastPoint, currentPoint);
        var angle = angleBetween(lastPoint, currentPoint);
        for (var j = 0; j < dist; j+=1) {
            x = lastPoint[0] + (Math.sin(angle) * j);
            y = lastPoint[1] + (Math.cos(angle) * j);
            ctx.fillRect(x-(ts/4), y-(ts/2), ts/2, ts);
        }
        lastPoint = currentPoint; 
    }   
}

function textureRoller(x,y,ctx,ts,drag) {
    ctx.fillStyle = toolColor;
    ctx.lineWidth = ts;
    ctx.globalAlpha = toolOpacity/5;
    if (!drag) {
        ctx.fillRect(x-(ts/2), y-(ts/8), ts, ts/4);
    } else {
        var currentPoint = [x, y];
        if (lastPoint == null) {
            lastPoint = currentPoint;
        }
        var dist = distanceBetween(lastPoint, currentPoint);
        var angle = angleBetween(lastPoint, currentPoint);
        for (var j = 0; j < dist; j+=1) {
            x = lastPoint[0] + (Math.sin(angle) * j);
            y = lastPoint[1] + (Math.cos(angle) * j);
            ctx.fillRect(x-(ts/2), y-(ts/8), ts, ts/4);
        }
        lastPoint = currentPoint;
    }
}

function textureSpray(x,y,ctx,ts) {
    ctx.globalAlpha = toolOpacity;
    var density = ts*4;
    for (var j = density; j--; ) {
        var angle = getRandomFloat(0, Math.PI*2);
        var radius = getRandomFloat(0, ts/2);
        ctx.fillStyle = toolColor;
        ctx.fillRect(x + radius * Math.cos(angle), y + radius * Math.sin(angle), 1, 1);
    }
}

function textureBlur(x,y,ctx,ts,drag) {
    var blurSize = ts / 2;
    ctx.lineWidth = blurSize;
    ctx.globalAlpha = toolOpacity/5;
    var rgb = "rgba(".concat($("#colorpicker").spectrum("get")._r,",",$("#colorpicker").spectrum("get")._g,",",$("#colorpicker").spectrum("get")._b,",");
    var radgrad = ctx.createRadialGradient(x,y,blurSize/8,x,y,blurSize);
    radgrad.addColorStop(0, rgb.concat("0.4)"));
    radgrad.addColorStop(0.5, rgb.concat("0.2)"));
    radgrad.addColorStop(1, rgb.concat("0)"));
    if (!drag) {
        ctx.fillStyle = radgrad;
        ctx.fillRect(x-blurSize, y-blurSize, blurSize*2, blurSize*2);
    } else {
        var currentPoint = [x, y];
        if (lastPoint == null) {
            lastPoint = currentPoint;
        }
        var dist = distanceBetween(lastPoint, currentPoint);
        var angle = angleBetween(lastPoint, currentPoint);
        for (var j = 0; j < dist; j+=5) {
            x = lastPoint[0] + (Math.sin(angle) * j);
            y = lastPoint[1] + (Math.cos(angle) * j);
            ctx.fillStyle = radgrad;
            ctx.fillRect(x-blurSize, y-blurSize, blurSize*2, blurSize*2);
        }
        lastPoint = currentPoint;
    }
}

function placeText(x,y,ctx,ts) {
    ctx.fillStyle = toolColor;
    ctx.globalAlpha = toolOpacity;
    ctx.font = ts.toString().concat("pt Stencil-Outline");
    ctx.fillText(stampSelected,x-ts/2,y+ts/2);
}

function placeSquare(x,y,ctx,ts) {
    ctx.fillStyle = toolColor;
    ctx.globalAlpha = toolOpacity;
    ctx.lineWidth = ts;
    ctx.fillRect(x-(ts/2), y-(ts/2), ts, ts);
}

function placeStar(x,y,ctx,ts,n) {
    ctx.strokeStyle = toolColor;
    ctx.fillStyle = toolColor;
    ctx.globalAlpha = toolOpacity;
    ctx.lineWidth = ts/10;
    var i;
    var angle = Math.PI / 2 * 3;
    var cx = x;
    var cy = y;
    var inner = ts/6;
    var outer = ts/2.5;
    var rotation = Math.PI/n;
    ctx.beginPath();
    ctx.moveTo(x, y-outer)
    for (i = 0; i < n; i++) {
        cx = x + Math.cos(angle) * outer;
        cy = y + Math.sin(angle) * outer;
        ctx.lineTo(cx, cy)
        angle += rotation 
        cx = x + Math.cos(angle) * inner;
        cy = y + Math.sin(angle) * inner;
        ctx.lineTo(cx, cy)
        angle += rotation 
    }
    ctx.lineTo(x, y-outer)
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

function placeHash(x,y,ctx,ts) {
    ctx.fillStyle = toolColor;
    ctx.globalAlpha = toolOpacity;
    ctx.lineWidth = ts;
    ctx.fillRect(x-(ts/2)-(ts/32), y+(ts/8)-(ts/16), ts, ts/16);
    ctx.fillRect(x-(ts/2)-(ts/32), y-(ts/8)-(ts/16), ts, ts/16);
    ctx.fillRect(x+(ts/8)-(ts/16), y-(ts/2)-(ts/32), ts/16, ts);
    ctx.fillRect(x-(ts/8)-(ts/16), y-(ts/2)-(ts/32), ts/16, ts);
}

function placeFlag(x,y,ctx,ts) {
    ctx.globalAlpha = toolOpacity;
    var imgWidth, imgHeight;
    if (Math.max(stampImgUse.width,stampImgUse.height) == stampImgUse.width) {
        imgWidth = ts;
        imgHeight = imgWidth * (stampImgUse.height / stampImgUse.width);
    } else {
        imgHeight = ts;
        imgWidth = imgHeight * (stampImgUse.width / stampImgUse.height);
    }
    ctx.drawImage(stampImgUse,x-(imgWidth/2),y-(imgHeight/2),imgWidth,imgHeight);
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


