

# Embedding the tool

The static site can be embeded in another website using the following code snippet

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