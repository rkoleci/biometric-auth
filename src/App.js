/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import { isWithinCirclePerimeter, getPictureResult, draw } from './utilities'

const CIRCLE_WIDTH = 300
const CIRCLE_HEIGHT = 300 

const MESSAGE_NOT_FOUND = 'Face not detected!'
const MESSAGE_FOUND = 'Success! Face detected!'

const DETECTION_INTERVAL = 500
const SHOW_DETECTION_BOX = true
let engine

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const circleRef = useRef(null)
  const blazeface = require('@tensorflow-models/blazeface')
  const videoRef = useRef(null);
  const [canvasLeft, setCanvasLeft] = useState(0)
  const [canvasTop, setCanvasTop] = useState(0)
  const [message, setMessage] = useState('')
  const [resolution, setResolution] = useState(null)
  const [cameraCenter, setCameraCenter] = useState(null)
  console.log(111, { resolution })

  const runFaceDetection = async () => {
    const model = await blazeface.load()
    engine = setInterval(() => {
      detect(model);
    }, DETECTION_INTERVAL);
  }
  console.log(111, 'init', webcamRef.current)

  useEffect(() => {
    // Function to initialize the webcam stream
    const initializeWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const resolution = { width: settings.width, height: settings.height };
        setResolution(resolution)
        setCameraCenter({ x: resolution.width/2, y: resolution.height/2 })

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
      terminate()
    };
  }, []);

  const stopFaceDetection = () => {
    clearInterval(engine)
  }

  const terminate = () => {
    stopFaceDetection()
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  }

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

      const predictions = await model.estimateFaces(video, false);

      const canvasLeftX = canvasRef?.current.getBoundingClientRect().left;
      setCanvasLeft(canvasLeftX)
      const canvasTopY = canvasRef?.current.getBoundingClientRect().top
      setCanvasTop(canvasTopY)

      const allowedLeftX = circleRef?.current?.getBoundingClientRect().left
      const allowedRightX = circleRef?.current?.getBoundingClientRect().right
      const allowedTopY = circleRef?.current?.getBoundingClientRect().top
      const allowedBottomY = circleRef?.current?.getBoundingClientRect().bottom
     
      const ctx = canvasRef.current.getContext("2d");
      if (SHOW_DETECTION_BOX) {
        draw(predictions, ctx)
      }
      const prediction = predictions[0]
      console.log(111,{ prediction })
      const faceDetected = isWithinCirclePerimeter(prediction,  canvasTopY, allowedTopY, allowedRightX, allowedBottomY, allowedLeftX, canvasLeftX)
     
      if (faceDetected) {
        console.log("Success! Face detected!")
        setMessage(MESSAGE_FOUND)
        const picture = webcamRef.current.getScreenshot()
        getPictureResult(picture)
      } else {
        console.log('Face not found!')
        setMessage(MESSAGE_NOT_FOUND)
      } 

    }

  }

  useEffect(() => {
    runFaceDetection();
  }, [])


  return (
    <div style={{
      position: 'relative', 
    }}>
    <div id='overlay' style={{
      background: 'black',
      width: '100%',
      height: '100vh',
      position:'relative'
    }}>
      {resolution && cameraCenter && (
        <>
        <Webcam
        ref={webcamRef}
        videoConstraints={{
          width: resolution.width,
          height: resolution.height,
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
          width: resolution.width,
          height: resolution.height,
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
          width: resolution.width,
          height: resolution.height,
          border: '2px solid red',
        }}
      /> 
 
       {webcamRef?.current && (
         <div style={{
          position: 'absolute',
          top: 20,
          left: canvasLeft + cameraCenter.x - (CIRCLE_WIDTH / 2),
          width: CIRCLE_WIDTH,
          zIndex: 15,
          padding: '4px 8px',
          textAlign: 'center'
        }}>
          <p style={{ background: 'gray', display: 'inline-block', padding: '4px 8px',borderRadius: '10px',color: "white"}}>{message}</p>
        </div>
       )}

      {webcamRef?.current && (
        <div
        ref={circleRef}
        style={{
          position: "absolute",
          top: canvasTop + cameraCenter?.y - (CIRCLE_HEIGHT / 2),
          left: canvasLeft + cameraCenter.x - (CIRCLE_WIDTH / 2),
          right: 0,
          bottom: 0,
          zIndex: 100,
          border: '2px solid blue',
          width: CIRCLE_WIDTH,
          height: CIRCLE_HEIGHT,
          borderRadius: '100%',
          boxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.7)'
        }}
      />
      )}
        </>
      )}
    </div>
    </div>
  );

}
export default App;