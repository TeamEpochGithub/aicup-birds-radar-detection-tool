

# Embedding the tool

The static site can be embeded in another website using the following code snippet. The embedded tool is mobile friendly.

1. Lazy embedding: only load the tool when the user interacts with it

```html
<div id="bird-radar-embed-wrapper" class="bird-radar-wrapper" onclick="loadBirdRadar()">

    <div id="bird-radar-placeholder" class="bird-radar-bg">
        
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4);"></div>

        <div style="position: relative; width: 80px; height: 80px; background-color: rgba(0, 0, 0, 0.75); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease-in-out; z-index: 20; box-shadow: 0 4px 15px rgba(0,0,0,0.5);" onmouseover="this.style.transform='scale(1.1)'; this.style.backgroundColor='rgba(37, 99, 235, 0.9)';" onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='rgba(0, 0, 0, 0.75)';">
            <div style="width: 0; height: 0; border-top: 16px solid transparent; border-bottom: 16px solid transparent; border-left: 26px solid white; margin-left: 6px;"></div>
        </div>
        
    </div>
</div>

<script>
function loadBirdRadar() {
    var wrapper = document.getElementById('bird-radar-embed-wrapper');
    
    wrapper.onclick = null;
    wrapper.style.cursor = 'default';

    wrapper.innerHTML = `
        <iframe 
            src="https://teamepochgithub.github.io/aicup-birds-radar-detection-tool/?embed=true" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; z-index: 30; animation: fadeIn 0.5s;" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
            allowfullscreen="">
        </iframe>
    `;
}
</script>

<style>
/* Base Styles (Mobile First) */
.bird-radar-wrapper {
    position: relative;
    width: 100%;
    max-width: 100%; /* Prevents breaking out of the WordPress container */
    height: 500px; /* Mobile height */
    border-radius: 12px;
    overflow: hidden; /* Changed back to hidden so the iframe respects the rounded corners */
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    border: 1px solid #334155;
    background-color: #1e293b;
    cursor: pointer;
    box-sizing: border-box; /* Ensures padding doesn't mess up width */
    margin: 0 auto; /* Centers the container just in case */
}

.bird-radar-bg {
    position: absolute;
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    background-size: cover; 
    background-position: center; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    z-index: 10; 
    transition: opacity 0.3s ease;
    /* --- MOBILE IMAGE URL GOES HERE --- */
    background-image: url('https://teamepochgithub.github.io/aicup-birds-radar-detection-tool/screenshots/bird-radar-screenshot-mobile.jpeg'); 
}

/* Desktop Styles (Applied when screen is wider than 768px) */
@media (min-width: 768px) {
    .bird-radar-wrapper {
        height: 750px; /* Taller on desktop */
    }
    
    .bird-radar-bg {
        /* --- DESKTOP IMAGE URL GOES HERE --- */
        background-image: url('https://teamepochgithub.github.io/aicup-birds-radar-detection-tool/screenshots/bird-radar-screenshot.jpeg');
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
```

2. Simple embedding: render the tool on page load

```html
<div class="bird-radar-embed-container" style="position: relative; width: 100%; height: 850px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid #334155;">
    <iframe 
        src="https://teamepochgithub.github.io/aicup-birds-radar-detection-tool/?embed=true" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
        allowfullscreen>
    </iframe>
</div>
```

The embedded tool is a subset of the full tool:

* No python
* No grid, only map
* No test set
* No uploading
* No statistics
* No features, only 3D plot in detail window
* Only a simple filter

The embedded version has a link to the full tool