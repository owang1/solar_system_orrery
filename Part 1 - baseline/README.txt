Olivia Wang
Assignment 4 - 3D Orrery Part 1
Due: 4/9/2021

How to run:
- Simply unzip and open the orrery-3d-baseline.html file in firefox. Make sure the trackball.js and Common folders are there

Overview
- All 11 tasks have been implemented and are working.
- In this assignment, I implemented a WebGL program that shows a 3D orrery containing the Sun, Mercury, Venus, Earth, and 
Earth's moon
- I started out with the baseline code given by Professor Wang. From there, I added the planets and orbits. I had some issues
with the orbit of the moon, but eventually figured it out with the professor's help. I stored
the earth's reference location as a matrix, and multiplied that by rotateY for the moon, translate for the moon's orbit (multiplied
by 45 to be seen), and the moon's scaling. 
- The tilting of the earth and moon's orbit was made possible by a rotateZ by a constant 23.5 degrees
- The orrery was scaled and tilted appropriately to occupy a wider aspect ratio
- I created additional buttons and forms with radio buttons to increase/decrease the day per frame value, and turn on/off the orbit,
day display, and animation
- I used the professor's provided trackball rotation code to implement trackball rotation for the orrery