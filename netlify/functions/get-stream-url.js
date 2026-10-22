/**
 * Netlify Serverless Function: get-stream-url
 *
 * Resolves a Google Drive fileId to a direct, streamable media URL
 * by following the redirect chain without downloading any content.
 *
 * Usage: /.netlify/functions/get-stream-url?fileId=YOUR_FILE_ID
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const { fileId } = event.queryStringParameters || {};

  if (!fileId || !/^[\w-]{10,}$/.test(fileId)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Missing or invalid fileId parameter." }),
    };
  }

  const initialUrl = `https://drive.google.com/uc?id=${fileId}&export=download&confirm=t`;

  try {
    let currentUrl = initialUrl;

    for (let hop = 0; hop < 6; hop++) {
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "video/*,audio/*,*/*",
        },
      });

      const status = response.status;
      const location = response.headers.get("location");

      if (status >= 200 && status < 300) break;

      if (status >= 300 && status < 400 && location) {
        currentUrl = location.startsWith("http")
          ? location
          : `https://drive.google.com${location}`;

        const isCdnUrl =
          !currentUrl.includes("drive.google.com") &&
          !currentUrl.includes("google.com/uc");

        if (isCdnUrl) break;
        continue;
      }

      if (status === 403 || status === 401) {
        return {
          statusCode: 403,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'Access denied. Make sure the file is shared as "Anyone with the link".',
          }),
        };
      }
      break;
    }

    const isLoginPage = currentUrl.includes("accounts.google.com");
    const isUnchanged = currentUrl === initialUrl;

    if (isLoginPage || isUnchanged) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Could not resolve stream URL. Check that the file is shared as "Anyone with the link".',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ url: currentUrl, fileId }),
    };
  } catch (err) {
    console.error("[get-stream-url] Error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Internal server error: ${err.message}` }),
    };
  }
};
