This works ok, just ok.

Parallelising into threads has some overhead with sending messages to workers. Check out the FPS though (chrome inspector FPS) and compare with the non-worker version (../main.js), offloading work to workers is _slightly_ slower (but could probably be optimised with more workers) but the rendering in the main thread is solid and decent.

Passing the typed array to workers is a clone operation though. We could look at sharing that structure (via transfer) rather than cloning, but this does make it unavailable to the main thread. For our purpose here that is actually fine as we dont actually _want_ to render it until after the update is complete, but, more generally, this will be problematic.
