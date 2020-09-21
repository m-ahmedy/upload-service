# Upload Service
## Required exports from src/backend.js
- **uploadHandler**

    Express handler function for the  `POST /upload` route

- **middleware**

    Array of the middlewares used with Express app by calling `app.use()`

## How to start
- Clone the repository to your **development** machine by `git clone `
- After developing the upload handler logic copy the handler function - the one inside `app.post("/upload", <This function>)` - and assign it to the `uploadHandler` export.
- Be sure to require all the dependencies in the response handler and add them to `package.json`. 
- Copy the whole folder to the server on which the IP of the host will be called, using `scp` command or any other method.
- From the terminal on the server cd to the directory and run '`sh script.sh 8000`' where 8000 is the port on which the service will be listening, can be changed if required just run the command again.
- The script would do all the infrastructure handling and starts the upload service on every reboot.
- You can check service status with `systemctl status upload.service`