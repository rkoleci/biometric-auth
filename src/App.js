import React, {useEffect, useRef} from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import {drawCircle, draw} from './utilities'


const SCORE = 0.8

const windowWidth = window.innerWidth
const windowHeight = window.innerHeight

const CIRCLE_WIDTH = 300
const CIRCLE_HEIGHT = 300
const CIRCLE_AT_FACE_LEVEL = true // false to show circle in center of screen

const top = ((windowHeight/2) - CIRCLE_HEIGHT/2) - (windowHeight*(CIRCLE_AT_FACE_LEVEL ? 0.1 : 0))
const left = (windowWidth/2) - CIRCLE_WIDTH/2

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const circleRef = useRef(null)
  const blazeface = require('@tensorflow-models/blazeface')
  const videoRef = useRef(null);

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
  if(
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ){
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

      console.log(predictions[0])
      

      const ctx = canvasRef.current.getContext("2d");
      draw(predictions, ctx)

      const prediction = predictions[0]
      if (prediction) {
        const boxWidth = prediction?.bottomRight[0] - prediction?.topLeft[0]
        console.log(222, { boxWidth })
      }
 
      
      
    }

  }

  useEffect(() => {
    runFacedetection();
  }, [])

   return (
     <div style={{
      
      width:'100%',
      height: '100%'
     }}>
      <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            top:0,
            left:0,
            right:0,
            bottom: 0,
            textAlign: "center",
            zIndex:9,
            width:'100%',
            height:'100%',
            border: '2px solid yellow'
         }}
          />
          
          
         <canvas
          ref={canvasRef}
          style={{
           position: "absolute",
           marginLeft: "auto",
           marginRight: "auto",
           top:0,
           left:0,
           right:0,
           bottom: 0,
           textAlign: "center",
           zIndex:9,
           width:'100%',
           height:'100%',
           border: '2px solid red'
        }}
         />

         <div
         ref={circleRef}
          style={{
            position: "absolute",
            top,
            left,
            right:0,
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