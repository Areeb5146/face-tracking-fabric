import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import { fabric } from "fabric";
import "./index.css";

const FaceDetectionApp = () => {
  const [videoSrc, setVideoSrc] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [extractedFaces, setExtractedFaces] = useState([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();
  let fabricCanvas = useRef();

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/weights");
      setIsModelLoaded(true);
    };
    loadModels();
  }, []);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
  };

  const setCanvasSize = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      fabricCanvas.current = new fabric.Canvas(canvas);
    }
  };

  const onPlay = async () => {
    const videoEl = videoRef.current;
    if (
      !videoEl ||
      videoEl.paused ||
      videoEl.ended ||
      !isModelLoaded ||
      videoEl.readyState < 2
    ) {
      setTimeout(() => onPlay(), 100);
      return;
    }

    const options = new faceapi.TinyFaceDetectorOptions();
    const results = await faceapi.detectAllFaces(videoEl, options);
    drawDetections(results);

    const faceImages = await faceapi.extractFaces(videoEl, results);
    setExtractedFaces(faceImages);

    if (isVideoPlaying) {
      requestAnimationFrame(onPlay);
    }
  };

  const drawDetections = (detections) => {
    const videoEl = videoRef.current;
    const scaleWidth = videoEl.clientWidth / videoEl.videoWidth;
    const scaleHeight = videoEl.clientHeight / videoEl.videoHeight;

    fabricCanvas.current.clear();
    detections.forEach((detection) => {
      const box = detection.box;
      const rect = new fabric.Rect({
        left: box.x * scaleWidth,
        top: box.y * scaleHeight,
        width: box.width * scaleWidth,
        height: box.height * scaleHeight,
        stroke: "red",
        strokeWidth: 2,
        fill: "transparent",
      });
      fabricCanvas.current.add(rect);
    });
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener("loadedmetadata", setCanvasSize);
    }

    return () => {
      if (videoEl) {
        videoEl.removeEventListener("loadedmetadata", setCanvasSize);
      }
    };
  }, [videoSrc]);

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (videoSrc && isVideoPlaying) {
      requestAnimationFrame(onPlay);
    }
  }, [videoSrc, isVideoPlaying]);

  const handlePlay = () => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.play();
      setIsVideoPlaying(true);
    }
  };

  const handlePause = () => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.pause();
      setIsVideoPlaying(false);
    }
  };

  return (
    <div className="container">
      <h3>Video Face tracking and Extraction</h3>
      <div className="row">
        <div className="col-md-6 ps-0 position-relative">
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            onLoadedMetadata={onPlay}
            style={{ maxWidth: "100%", height: "auto" }}
          />
          <canvas
            ref={canvasRef}
            className="position-absolute"
            style={{ top: 0, left: 0, maxWidth: "100%", maxHeight: "100%" }}
          />
        </div>
        <div className="col-md-6">
          {extractedFaces.map((face, index) => (
            <img key={index} src={face.toDataURL()} alt="Extracted Face" />
          ))}
        </div>
      </div>
      <div className="row pt-5">
        <input type="file" accept="video/*" onChange={handleVideoUpload} />
        <div>
          <button onClick={handlePlay}>Play</button>
          <button onClick={handlePause}>Pause</button>
        </div>
      </div>
    </div>
  );
};

export default FaceDetectionApp;
