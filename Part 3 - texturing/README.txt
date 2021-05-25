Olivia Wang
Assignment 6 - 3D Orrery Part 3 (with texturing)
Due: 5/2/2021

How to run:
- Simply unzip and open the orrery-3d-part-3-texturing.html file in firefox. Make sure the trackball.js, Common folder, and jpg files are there

Overview
- All tasks are implemented and run correctly
- I started with the part 2 code, and consulted the earth texturing code example by Prof Wang
- The jpg images for textures were all provided. I loaded them in the initTexture() function
- A new global array called textureCoordData was used for storing sphere vertex texture coordinates
- drawSphere() was updated to account for sphere textures
- For self-spinning of the Earth, I had rotateY for the noncommonMVMatrix of Earth. The daysPerFrame
value was decreased from 1.0 to 0.0625 to slow down the spinning (otherwise it looks like it's not
spinning)