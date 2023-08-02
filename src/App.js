import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import { drawCircle, draw } from './utilities'


const SCORE = 0.8

const windowWidth = window.innerWidth
const windowHeight = window.innerHeight

const CAMERA_RESOLUTION_WIDTH = 1280
const CAMERA_RESOLUTION_HEIGHT = 720

const CAMERA_CENTER_X = CAMERA_RESOLUTION_WIDTH / 2
const CAMERA_CENTER_Y = CAMERA_RESOLUTION_HEIGHT / 2

const CIRCLE_WIDTH = 300
const CIRCLE_HEIGHT = 300 

const MESSAGE_NOT_FOUND = 'Face not detected!'
const MESSSAGE_FOUND = 'Success! Face detected!'

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const circleRef = useRef(null)
  const blazeface = require('@tensorflow-models/blazeface')
  const videoRef = useRef(null);
  const [canvasLeft, setCanvasLeft] = useState(0)
  const [canvasTop, setCanvasTop] = useState(0)
  const [message, setMessage] = useState('')
  console.log(111, canvasTop, canvasLeft)

  const runFacedetection = async () => {

    const model = await blazeface.load()
    console.log("FaceDetection Model is Loaded..")
    setInterval(() => {
      detect(model);
    }, 500);

  }


  const returnTensors = false;

  useEffect(() => {
    // Function to initialize the webcam stream
    const initializeWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const resolution = { width: settings.width, height: settings.height };

        // Set the stream as the video element's source
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    initializeWebcam();

    // Clean up the stream when the component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const detect = async (model) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get video properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      //Set video height and width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      //Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make detections

      const predictions = await model.estimateFaces(video, returnTensors);

      const canvasLeftX = canvasRef?.current.getBoundingClientRect().left;
      setCanvasLeft(canvasLeftX)
      const canvasTopY = canvasRef?.current.getBoundingClientRect().top
      setCanvasTop(canvasTopY)

      const allowedLeftX = circleRef?.current?.getBoundingClientRect().left
      const allowedRightX = circleRef?.current?.getBoundingClientRect().right
      const allowedTopY = circleRef?.current?.getBoundingClientRect().top
      const allowedBottomY = circleRef?.current?.getBoundingClientRect().bottom

      console.log(111, { allowedRightX })
     
      const ctx = canvasRef.current.getContext("2d");
      draw(predictions, ctx)
      const prediction = predictions[0]
      console.log(111, prediction?.bottomRight[1]??-1)
      
      if (prediction?.topLeft && prediction.bottomRight) {

        if (prediction.topLeft[0] + canvasLeftX >= allowedLeftX // Left X
          && prediction.bottomRight[0] <= allowedRightX // Right X
          && prediction.topLeft[1] + canvasTopY >= allowedTopY // Top Y
          && prediction.bottomRight[1] <= allowedBottomY) { // Bottom Y

          console.log("Success! Face detected!")
          setMessage(MESSSAGE_FOUND)

        } else {
          console.log('Face not found!')
          setMessage(MESSAGE_NOT_FOUND)
        }
      }



    }

  }

  useEffect(() => {
    runFacedetection();
  }, [])


  return (
    <div style={{
      background: 'black',
      width: '100%',
      height: '100vh'
    }}>
      <Webcam
        ref={webcamRef}
        videoConstraints={{
          width: CAMERA_RESOLUTION_WIDTH,
          height: CAMERA_RESOLUTION_HEIGHT,
          facingMode: "user"
        }}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          textAlign: "center",
          zIndex: 9,
          width: CAMERA_RESOLUTION_WIDTH,
          height: CAMERA_RESOLUTION_HEIGHT,
          border: '2px solid yellow'
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          textAlign: "center",
          zIndex: 9,
          width: CAMERA_RESOLUTION_WIDTH,
          height: CAMERA_RESOLUTION_HEIGHT,
          border: '2px solid red'
        }}
      />

        <p style={{
          position: 'absolute',
          top: 100 ,
          left: canvasLeft + CAMERA_CENTER_X - (CIRCLE_WIDTH / 2) + 100,
          zIndex: 15,
          background: 'black',
          color: "white",
          borderRadius: '10px',
          padding: '4px 8px'
        }}>{message}</p>

      <div
        ref={circleRef}
        style={{
          position: "absolute",
          top: canvasTop + CAMERA_CENTER_Y - (CIRCLE_HEIGHT / 2),
          left: canvasLeft + CAMERA_CENTER_X - (CIRCLE_WIDTH / 2),
          right: 0,
          bottom: 0,
          zIndex: 10,
          border: '2px solid blue',
          width: CIRCLE_WIDTH,
          height: CIRCLE_HEIGHT,
          borderRadius: '100%'
        }}
      />
    </div>
  );

}
export default App;