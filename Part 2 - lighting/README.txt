Olivia Wang
Assignment 5 - 3D Orrery Part 2 (with lighting)
Due: 4/16/2021

How to run:
- Simply unzip and open the orrery-3d-part-2-lighting.html file in firefox. Make sure the trackball.js and Common folder are there

Overview
- All 6 tasks are implemented and working
- I started with my baseline part 1 orrery code from last week
- I consulted the past lectures and sample codes, especially the shadedSphereEyeSpace code by Prof. Wang, to figure out Tasks 1 through 4
- To modulate the fragment color (having both the light and existing planet colors) I multiplied v_fColor by u_color in the 
fragment shader
- For the RGB light sliders, I made the range sliders set variables red_val, green_val, and blue_val. These variables were then 
multiplied by the default diffuse and specular light values (1.0, 1.0, 1.0) to interactively adjust the lighting colors
- The RGB sliders are initially set to 1.0 whenever the page is refreshed, giving the default white light
