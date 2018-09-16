// Variable initialisation
var canvas = document.querySelector( '#canvas' );
var context = canvas.getContext( '2d' );
var linePoints = [];
var toolMode = 'draw'
var toolSize = 20;
var toolColor = '#000000'
var canvasState = [];
var redoBuffer = [];
var undoButton = document.querySelector( '[data-action=undo]' );
var redoButton = document.querySelector( '[data-action=redo]' );

// Defaults
context.strokeStyle = "#000000";
context.lineWidth = 20;
context.lineJoin = "round";
context.lineCap = "round";

// Event listeners
canvas.addEventListener( 'mousedown', draw );
canvas.addEventListener( 'touchstart', draw );
window.addEventListener( 'mouseup', stop );
window.addEventListener( 'touchend', stop );
window.addEventListener( 'mousemove', setColor );
window.addEventListener( 'mousemove', setSize );
document.querySelector( '#toolbar' ).addEventListener( 'click', selectTool );

// Functions
function clearCanvas() {
    var result = confirm( 'Are you sure you want to delete the picture?' );
    if ( result ) {
        context.clearRect( 0, 0, canvas.width, canvas.height );
        canvasState.length = 0;
        undoButton.classList.add('disabled');
    }
}

function draw( e ) {
    if ( e.which === 1 || e.type === 'touchstart' || e.type === 'touchmove') {
        window.addEventListener( 'mousemove', draw );
        window.addEventListener( 'touchmove', draw );
        var mouseX = e.pageX - canvas.offsetLeft;
        var mouseY = e.pageY - canvas.offsetTop;
        var mouseDrag = e.type === 'mousemove';
        if ( e.type === 'touchstart' || e.type === 'touchmove' ) {
            mouseX = e.touches[0].pageX - canvas.offsetLeft;
            mouseY = e.touches[0].pageY - canvas.offsetTop;
            mouseDrag = e.type === 'touchmove';
        }
        if ( e.type === 'mousedown' || e.type === 'touchstart') saveState();
        linePoints.push( { x: mouseX, y: mouseY, drag: mouseDrag, width: toolSize, color: toolColor } );
        updateCanvas();
    }
}

function highlightButton( button ) {
    var buttons = button.parentNode.parentNode.querySelectorAll( 'div' );
    buttons.forEach( function( element ){ element.classList.remove( 'active' ) } );
    button.parentNode.classList.add( 'active' );
  
}

function renderLine() {
    for ( var i = 0, length = linePoints.length; i < length; i++ ) {
        if ( !linePoints[i].drag ) {
            //context.stroke();
            context.beginPath();
            context.lineWidth = linePoints[i].width;
            context.strokeStyle = linePoints[i].color;
            context.moveTo( linePoints[i].x, linePoints[i].y );
            context.lineTo( linePoints[i].x + 0.5, linePoints[i].y + 0.5 );
        } else {
            context.lineTo( linePoints[i].x, linePoints[i].y );
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
    console.log(canvasState[0]);
    linePoints = [];
    if ( canvasState.length > 25 ) canvasState.length = 25;
    redoBuffer = [];
}

function selectTool( e ) {
    if ( e.target === e.currentTarget ) return;
    if ( e.target.dataset.mode ) highlightButton( e.target );
    toolSize = e.target.dataset.size || toolSize;
    toolMode = e.target.dataset.mode || toolMode;
    toolColor = e.target.dataset.color || toolColor;
    if ( e.target === undoButton ) undoState();
    if ( e.target === redoButton ) redoState();
    if ( e.target.dataset.action == 'delete' ) clearCanvas();
}

function stop( e ) {
    if ( e.which === 1 || e.type === 'touchend') {
        window.removeEventListener( 'mousemove', draw );
        window.removeEventListener( 'touchmove', draw );
    }
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

function updateCanvas() {
    context.clearRect( 0, 0, canvas.width, canvas.height );
    context.putImageData( canvasState[0], 0, 0 );
    renderLine();
}

function toggleColors() {
    document.getElementById("dropdownColor").classList.toggle("show");
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show') && openDropdown.id !== 'dropdownColor') {
            openDropdown.classList.toggle('show');
        }
    }
}

function toggleSize() {
    document.getElementById("dropdownSize").classList.toggle("show");
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show') && openDropdown.id !== 'dropdownSize') {
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


