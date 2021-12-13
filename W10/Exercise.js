// Animation Duration in seconds
var animationDuration = 10.0;

// Values to interpolate
const keyframes_x = 
[
  {time:0.0, value:-16.0, tangent_in:0.0, tangent_out:0.0}, // start
  {time:3.0, value:-4.0, tangent_in:4.0, tangent_out: 4.0}, // start jump
  {time:5.0, value:4.0, tangent_in: 4.0, tangent_out:4.0}, // end jump
  {time:5.9, value:7.6, tangent_in: 4.0, tangent_out:2.0}, // first bounce
  {time:6.5, value:8.8, tangent_in: 2.0, tangent_out:2.0}, // first peak
  {time:7.1, value:10.0, tangent_in: 2.0, tangent_out:1.0}, // second bounce
  {time:7.5, value:10.4, tangent_in: 1.0, tangent_out:1.0}, // second peak
  {time:7.9, value:10.8, tangent_in: 1.0, tangent_out:1.0}, // ground
  {time:8.1, value:11.0, tangent_in: 1.0, tangent_out:0.5}, // ground
  {time:8.3, value:11.1, tangent_in: 0.5, tangent_out:0.25}, // decelerate
  {time:8.5, value:11.15, tangent_in: 0.25, tangent_out:0.125}, // decelerate
  {time:8.7, value:11.175, tangent_in: 0.125, tangent_out:0.0}, // stop
];

const keyframes_y = 
[
  {time:0.0, value:1.0, tangent_in:0.0, tangent_out:0.0}, // start
  {time:3.0, value:1.0, tangent_in:0.0, tangent_out: 2.0}, // start jump
  {time:5.0, value:5.0, tangent_in: 2.0, tangent_out:2.0}, // end jump
  {time:5.9, value:1.0, tangent_in: -6.0, tangent_out:3.0}, // first bounce
  {time:6.5, value:1.9, tangent_in: 0.0, tangent_out:0.0}, // first peak
  {time:7.1, value:1.0, tangent_in: -3, tangent_out:1.0}, // second bounce
  {time:7.5, value:1.2, tangent_in: 0.0, tangent_out:0.0}, // second peak
  {time:7.9, value:1.0, tangent_in: -1.0, tangent_out:0.0}, // ground
];

// We can plug in the negative x tangents.
const keyframes_alpha = 
[
  {time:0.0, value:0.0, tangent_in:0.0, tangent_out:0.0}, // start
  {time:3.0, value:-12, tangent_in:-4.0, tangent_out: -4.0}, // start jump
  {time:5.0, value:-20.0, tangent_in: -4.0, tangent_out:-4.0}, // end jump
  {time:5.9, value:-23.6, tangent_in: -4.0, tangent_out:-2.0}, // first bounce
  {time:6.5, value:-24.8, tangent_in: -2.0, tangent_out:-2.0}, // first peak
  {time:7.1, value:-26, tangent_in: -2.0, tangent_out:-1.0}, // second bounce
  {time:7.5, value:-26.4, tangent_in: -1.0, tangent_out:-1.0}, // second peak
  {time:7.9, value:-26.8, tangent_in: -1.0, tangent_out:-1.0}, // ground
  {time:8.1, value:-27.0, tangent_in: -1.0, tangent_out:-0.5}, // ground
  {time:8.3, value:-27.1, tangent_in: -0.5, tangent_out:-0.25}, // decelerate
  {time:8.5, value:-27.15, tangent_in: -0.25, tangent_out:-0.125}, // decelerate
  {time:8.7, value:-27.175, tangent_in: -0.125, tangent_out:-0.0}, // stop
];

function getPrevFrameIdx(keyframes)
{
  var prevKeyframeIdx = 0;
  for(var i = 1; i < keyframes.length; i++)
  {
    if(animationTime < keyframes[i].time)
    {
      break;
    }
    prevKeyframeIdx++;
  }

  return prevKeyframeIdx;
}

function getNextFrameIdx(keyframes)
{
  var prevKeyframeIdx = getPrevFrameIdx(keyframes);
  var nextKeyframeIdx = prevKeyframeIdx+1;

  // Handle special cases
  if(nextKeyframeIdx >= keyframes.length || animationTime < keyframes[prevKeyframeIdx].time)
  {
    nextKeyframeIdx = prevKeyframeIdx;
  }

  return nextKeyframeIdx;
}

function getNormalizedTimeOffset(keyframes, prevKeyframeIdx, nextKeyframeIdx)
{
  var keyframeDuration = keyframes[nextKeyframeIdx].time - keyframes[prevKeyframeIdx].time;
  var timeOffset = animationTime - keyframes[prevKeyframeIdx].time;
  var normalizedTimeOffset = 0.0;
  if(keyframeDuration != 0)
  {
    normalizedTimeOffset = timeOffset / keyframeDuration;
  }
  return normalizedTimeOffset;
}

function nearestNeighbor(keyframes)
{
  var prevKeyframeIdx = getPrevFrameIdx(keyframes);
  var nextKeyframeIdx = getNextFrameIdx(keyframes);

  var prevKeyframeVal = keyframes[prevKeyframeIdx].value;
  var nextKeyframeVal = keyframes[nextKeyframeIdx].value;

  var normalizedTimeOffset = getNormalizedTimeOffset(keyframes, prevKeyframeIdx, nextKeyframeIdx);

  // Taks 1
  // Implement nearest neighbor
  if(normalizedTimeOffset < 0.5)
  {
    return prevKeyframeVal;
  }
  else
  {
    return nextKeyframeVal;
  }
}

function linearInterpolation(keyframes)
{
  var prevKeyframeIdx = getPrevFrameIdx(keyframes);
  var nextKeyframeIdx = getNextFrameIdx(keyframes);

  var prevKeyframeVal = keyframes[prevKeyframeIdx].value;
  var nextKeyframeVal = keyframes[nextKeyframeIdx].value;

  var normalizedTimeOffset = getNormalizedTimeOffset(keyframes, prevKeyframeIdx, nextKeyframeIdx);

  // Task 2
  // Implement Linear Interpolation
  //New value for result
  const result =  prevKeyframeVal * (1.0 - normalizedTimeOffset) + nextKeyframeVal * (normalizedTimeOffset);
  return result;
}

function cubicSplineInterpolation(keyframes)
{
  var prevKeyframeIdx = getPrevFrameIdx(keyframes);
  var nextKeyframeIdx = getNextFrameIdx(keyframes);

  var prevKeyframeVal = keyframes[prevKeyframeIdx].value;
  var nextKeyframeVal = keyframes[nextKeyframeIdx].value;

  var normalizedTimeOffset = getNormalizedTimeOffset(keyframes, prevKeyframeIdx, nextKeyframeIdx);

  var prevTangent = keyframes[prevKeyframeIdx].tangent_out;
  var nextTangent = keyframes[nextKeyframeIdx].tangent_in;

  // Time is warped due to normalization. The following code restores the correct slopes for our normalized parameter.
  const keyframeDuration = keyframes[nextKeyframeIdx].time - keyframes[prevKeyframeIdx].time;
  prevTangent = prevTangent * keyframeDuration;
  nextTangent = nextTangent * keyframeDuration;

  // Task 3
  // Implement Hermite Spline Interpolation
  // We use the formula shown in the exercise
  // Cubic time polynomial
  const t = normalizedTimeOffset;
  const t2 = t*t;
  const t3 = t*t*t;
  //Formula
  const newVal = (2.0*t3 - 3.0*t2 + 1.0) * prevKeyframeVal + (t3 - 2.0*t2 + t)*prevTangent + (-2.0*t3 + 3.0*t2) * nextKeyframeVal + (t3-t2)*nextTangent;
  return newVal;
}

function updateInterpolatedParamsForCurrentAnimationTime()
{
  // Task 1
  //sphere_x = nearestNeighbor(keyframes_x);
  //sphere_y = nearestNeighbor(keyframes_y);
  //sphere_alpha = nearestNeighbor(keyframes_alpha);

  // Task 2
  //sphere_x = linearInterpolation(keyframes_x);
  //sphere_y = linearInterpolation(keyframes_y);
  //sphere_alpha = linearInterpolation(keyframes_alpha);

  // Task 3
  sphere_x = cubicSplineInterpolation(keyframes_x);
  sphere_y = cubicSplineInterpolation(keyframes_y);
  sphere_alpha = cubicSplineInterpolation(keyframes_alpha);

  // Task 4
  // Go to the keyframe structure and modify the tangents such that the animation looks physically plausible.
}