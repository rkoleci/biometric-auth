// Drawing function
export const draw = (predictions, ctx) => {
    if (predictions.length > 0) {
        
        for (let i = 0; i < predictions.length; i++) {
          const start = predictions[i].topLeft;
          const end = predictions[i].bottomRight;
          const size = [end[0] - start[0], end[1] - start[1]];
    
          // Render a rectangle over each detected face.
          
          ctx.beginPath();
          ctx.lineWidth = "6";
          ctx.strokeStyle = "red";
          ctx.rect(start[0], start[1], size[0], size[1]);
          ctx.stroke();
        }
      }

}; 

export function drawCircle(ctx, centerX, centerY, radius) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'blue'; // Change color if desired
  ctx.fill();
}

export function getPictureResult(base64String) {
  const src = blobUrl(sanitizeBase64String(base64String))
  return getLaplacianAnalysis(src)
}

export function blobUrl(b64Data) {
  const blob = b64toBlob(b64Data);
  const src = URL.createObjectURL(blob)

  getLaplacianAnalysis(src)
  return src

};

function b64toBlob(b64Data, contentType = "image/png", sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (
    let offset = 0;
    offset < byteCharacters.length;
    offset += sliceSize
  ) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export function getLaplacianAnalysis(src) {
  const image = new Image();
  image.src = src

  image.onload = function () {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    const data = imageData.data;
    const len = data.length;
    let sum = 0;

    // Convert image to grayscale and calculate sum of pixel values
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const avg = Math.floor((r + g + b) / 3);
      data[i] = data[i + 1] = data[i + 2] = avg;
      sum += avg;
    }

    // Calculate average brightness
    const avgBrightness = sum / (len / 4);

    // Calculate variance of Laplacian
    let variance = 0;
    for (let i = 0; i < len; i += 4) {
      const laplacian = Math.abs(data[i] - avgBrightness);
      variance += laplacian * laplacian;
    }
    variance /= len / 4;

    // Define a threshold for blurriness
    const blurThreshold = 1000; // the higher the better quality will be required

    // Display the result
    if (variance < blurThreshold) {
      console.log(111, "The image is blurry.");
    } else {
      console.log(111,  "The image is sharp.");
    }
  };
}

function sanitizeBase64String(base64String) {
  if (base64String.includes('data:image/webp;base64,')) {
    return base64String.replace('data:image/webp;base64,', '')
  }
  return base64String
}

export function isWithinCirclePerimeter(prediction, canvasTopY, allowedTopY, allowedRightX, allowedBottomY, allowedLeftX, canvasLeftX ) {
  if (prediction?.topLeft && prediction.bottomRight) {

    if (prediction.topLeft[0] + canvasLeftX >= allowedLeftX // Left X
      && prediction.bottomRight[0] + canvasLeftX <= allowedRightX // Right X
      && prediction.topLeft[1] + canvasTopY >= allowedTopY // Top Y
      && prediction.bottomRight[1] <= allowedBottomY) { // Bottom Y
        return true 
    } 
  } 

  return false
}