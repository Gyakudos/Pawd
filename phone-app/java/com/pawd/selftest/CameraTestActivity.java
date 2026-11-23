package com.pawd.selftest;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.RectF;
import android.graphics.SurfaceTexture;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.media.Image;
import android.media.ImageReader;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Size;
import android.view.Surface;
import android.view.TextureView;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Semaphore;

public class CameraTestActivity extends Activity {
    private static final int REQ_CAMERA = 200;

    private TextureView textureView;
    private TextView status;
    private Button switchBtn;
    private Button torchBtn;
    private Button captureBtn;

    private CameraManager manager;
    private CameraDevice cameraDevice;
    private CameraCaptureSession session;
    private ImageReader imageReader;
    private CaptureRequest.Builder previewBuilder;
    private Size previewSize;
    private String cameraId;
    private int facing = CameraCharacteristics.LENS_FACING_BACK;
    private boolean torchOn = false;

    private HandlerThread backgroundThread;
    private Handler backgroundHandler;
    private final Semaphore openCloseLock = new Semaphore(1);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        manager = (CameraManager) getSystemService(Context.CAMERA_SERVICE);

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "Camera & flashlight",
                "Check front and back preview, capture a photo, and toggle the torch.");

        status = Ui.text(this, "Starting camera\u2026", 12f, Ui.MUTED);
        status.setPadding(0, 0, 0, Ui.dp(this, 8));
        root.addView(status);

        FrameLayout previewWrap = new FrameLayout(this);
        previewWrap.setBackgroundColor(0xFF000000);
        previewWrap.setClipToOutline(true);
        textureView = new TextureView(this);
        previewWrap.addView(textureView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(previewWrap, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        LinearLayout controls = Ui.row(this);
        controls.setPadding(0, Ui.dp(this, 10), 0, 0);
        switchBtn = Ui.button(this, "Switch camera", 0xFF334155);
        torchBtn = Ui.button(this, "Torch off", 0xFF334155);
        captureBtn = Ui.button(this, "Take photo", Ui.ACCENT);
        switchBtn.setOnClickListener(v -> switchCamera());
        torchBtn.setOnClickListener(v -> toggleTorch());
        captureBtn.setOnClickListener(v -> capturePhoto());
        controls.addView(switchBtn);
        LinearLayout.LayoutParams lp1 = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp1.leftMargin = Ui.dp(this, 8);
        controls.addView(torchBtn, lp1);
        LinearLayout.LayoutParams lp2 = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp2.leftMargin = Ui.dp(this, 8);
        controls.addView(captureBtn, lp2);
        root.addView(controls);

        root.addView(Ui.footer(this, "camera"));
        setContentView(root);

        textureView.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override
            public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
                openCamera();
            }

            @Override
            public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {
                configureTransform(width, height);
            }

            @Override
            public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
                return true;
            }

            @Override
            public void onSurfaceTextureUpdated(SurfaceTexture surface) {}
        });

        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA);
        }
    }

    private void configureTransform(int viewWidth, int viewHeight) {
        if (previewSize == null || textureView == null) return;
        int rotation = getWindowManager().getDefaultDisplay().getRotation();
        Matrix matrix = new Matrix();
        RectF viewRect = new RectF(0, 0, viewWidth, viewHeight);
        RectF bufferRect = new RectF(0, 0, previewSize.getHeight(), previewSize.getWidth());
        float centerX = viewRect.centerX();
        float centerY = viewRect.centerY();
        if (Surface.ROTATION_90 == rotation || Surface.ROTATION_270 == rotation) {
            bufferRect.offset(centerX - bufferRect.centerX(), centerY - bufferRect.centerY());
            matrix.setRectToRect(viewRect, bufferRect, Matrix.ScaleToFit.FILL);
            float scale = Math.max(
                    (float) viewHeight / previewSize.getHeight(),
                    (float) viewWidth / previewSize.getWidth());
            matrix.postScale(scale, scale, centerX, centerY);
            matrix.postRotate(90 * (rotation - 2), centerX, centerY);
        } else if (Surface.ROTATION_180 == rotation) {
            matrix.postRotate(180, centerX, centerY);
        }
        textureView.setTransform(matrix);
    }

    private void openCamera() {
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            status.setText("Camera permission is required.");
            return;
        }
        try {
            if (!openCloseLock.tryAcquire(2500, java.util.concurrent.TimeUnit.MILLISECONDS)) {
                status.setText("Timed out waiting for camera.");
                return;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        try {
            cameraId = findCameraId(facing);
            if (cameraId == null) {
                status.setText("No camera found for this direction.");
                openCloseLock.release();
                return;
            }
            CameraCharacteristics chars = manager.getCameraCharacteristics(cameraId);
            StreamConfigurationMap map = chars.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);
            if (map == null) {
                status.setText("Camera configuration unavailable.");
                openCloseLock.release();
                return;
            }
            previewSize = chooseSize(map.getOutputSizes(SurfaceTexture.class), 1920, 1080);
            if (previewSize == null) {
                Size[] sizes = map.getOutputSizes(SurfaceTexture.class);
                if (sizes != null && sizes.length > 0) previewSize = sizes[0];
            }
            if (previewSize == null) {
                status.setText("No preview sizes reported.");
                openCloseLock.release();
                return;
            }

            imageReader = ImageReader.newInstance(
                    previewSize.getWidth(), previewSize.getHeight(), ImageFormat.JPEG, 2);
            imageReader.setOnImageAvailableListener(new ImageReader.OnImageAvailableListener() {
                @Override
                public void onImageAvailable(ImageReader reader) {
                    saveImage(reader);
                }
            }, backgroundHandler);

            status.setText("Opening " + (facing == CameraCharacteristics.LENS_FACING_FRONT ? "front" : "back")
                    + " camera \u00b7 " + previewSize.getWidth() + "\u00d7" + previewSize.getHeight());
            manager.openCamera(cameraId, stateCallback, backgroundHandler);
        } catch (CameraAccessException | SecurityException e) {
            openCloseLock.release();
            status.setText("Could not open camera: " + e.getMessage());
        }
    }

    private final CameraDevice.StateCallback stateCallback = new CameraDevice.StateCallback() {
        @Override
        public void onOpened(CameraDevice camera) {
            cameraDevice = camera;
            openCloseLock.release();
            createPreviewSession();
        }

        @Override
        public void onDisconnected(CameraDevice camera) {
            openCloseLock.release();
            camera.close();
            cameraDevice = null;
        }

        @Override
        public void onError(CameraDevice camera, int error) {
            openCloseLock.release();
            camera.close();
            cameraDevice = null;
            runOnUiThread(() -> status.setText("Camera error: " + error));
        }
    };

    private void createPreviewSession() {
        try {
            SurfaceTexture texture = textureView.getSurfaceTexture();
            if (texture == null || cameraDevice == null) return;
            texture.setDefaultBufferSize(previewSize.getWidth(), previewSize.getHeight());
            Surface surface = new Surface(texture);

            previewBuilder = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
            previewBuilder.addTarget(surface);
            if (facing == CameraCharacteristics.LENS_FACING_BACK) {
                previewBuilder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON);
                previewBuilder.set(CaptureRequest.FLASH_MODE,
                        torchOn ? CaptureRequest.FLASH_MODE_TORCH : CaptureRequest.FLASH_MODE_OFF);
            }

            List<Surface> surfaces = new ArrayList<>();
            surfaces.add(surface);
            if (imageReader != null) surfaces.add(imageReader.getSurface());

            cameraDevice.createCaptureSession(surfaces, new CameraCaptureSession.StateCallback() {
                @Override
                public void onConfigured(CameraCaptureSession s) {
                    if (cameraDevice == null) return;
                    session = s;
                    try {
                        session.setRepeatingRequest(previewBuilder.build(), null, backgroundHandler);
                        runOnUiThread(() -> status.setText("Preview running. Take a photo to test capture."));
                    } catch (CameraAccessException e) {
                        runOnUiThread(() -> status.setText("Preview failed: " + e.getMessage()));
                    }
                }

                @Override
                public void onConfigureFailed(CameraCaptureSession s) {
                    runOnUiThread(() -> status.setText("Camera preview configuration failed."));
                }
            }, backgroundHandler);
            configureTransform(textureView.getWidth(), textureView.getHeight());
        } catch (CameraAccessException | IllegalStateException e) {
            status.setText("Preview setup failed: " + e.getMessage());
        }
    }

    private void capturePhoto() {
        if (cameraDevice == null || session == null || imageReader == null) {
            status.setText("Camera is not ready yet.");
            return;
        }
        try {
            CaptureRequest.Builder still = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE);
            still.addTarget(imageReader.getSurface());
            still.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
            still.set(CaptureRequest.JPEG_ORIENTATION, jpegOrientation());
            session.capture(still.build(), null, backgroundHandler);
            status.setText("Capturing\u2026");
        } catch (CameraAccessException e) {
            status.setText("Capture failed: " + e.getMessage());
        }
    }

    private void saveImage(ImageReader reader) {
        Image image = null;
        try {
            image = reader.acquireLatestImage();
            if (image == null) return;
            ByteBuffer buffer = image.getPlanes()[0].getBuffer();
            byte[] bytes = new byte[buffer.remaining()];
            buffer.get(bytes);

            File dir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
            if (dir == null) dir = getCacheDir();
            if (!dir.exists()) dir.mkdirs();
            File file = new File(dir, "pawd-test-" + System.currentTimeMillis() + ".jpg");
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(bytes);
            }
            final String path = file.getAbsolutePath();
            runOnUiThread(() -> status.setText("Photo saved: " + path));
        } catch (Exception e) {
            runOnUiThread(() -> status.setText("Photo save failed: " + e.getMessage()));
        } finally {
            if (image != null) image.close();
        }
    }

    private int jpegOrientation() {
        try {
            int deviceOrientation;
            int rotation = getWindowManager().getDefaultDisplay().getRotation();
            switch (rotation) {
                case Surface.ROTATION_90: deviceOrientation = 90; break;
                case Surface.ROTATION_180: deviceOrientation = 180; break;
                case Surface.ROTATION_270: deviceOrientation = 270; break;
                default: deviceOrientation = 0; break;
            }
            CameraCharacteristics chars = manager.getCameraCharacteristics(cameraId);
            Integer sensor = chars.get(CameraCharacteristics.SENSOR_ORIENTATION);
            int so = sensor == null ? 0 : sensor;
            if (facing == CameraCharacteristics.LENS_FACING_FRONT) {
                return (so - deviceOrientation + 360) % 360;
            }
            return (so + deviceOrientation) % 360;
        } catch (CameraAccessException e) {
            return 0;
        }
    }

    private void switchCamera() {
        facing = facing == CameraCharacteristics.LENS_FACING_BACK
                ? CameraCharacteristics.LENS_FACING_FRONT
                : CameraCharacteristics.LENS_FACING_BACK;
        torchOn = false;
        torchBtn.setText("Torch off");
        closeCamera();
        openCamera();
    }

    private void toggleTorch() {
        if (facing != CameraCharacteristics.LENS_FACING_BACK) {
            status.setText("Switch to the back camera to use the torch.");
            return;
        }
        torchOn = !torchOn;
        torchBtn.setText(torchOn ? "Torch on" : "Torch off");
        if (session != null && previewBuilder != null) {
            try {
                previewBuilder.set(CaptureRequest.FLASH_MODE,
                        torchOn ? CaptureRequest.FLASH_MODE_TORCH : CaptureRequest.FLASH_MODE_OFF);
                previewBuilder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON);
                session.setRepeatingRequest(previewBuilder.build(), null, backgroundHandler);
                status.setText(torchOn ? "Torch on." : "Torch off.");
                return;
            } catch (CameraAccessException ignored) {}
        }
        try {
            String backId = findCameraId(CameraCharacteristics.LENS_FACING_BACK);
            if (backId != null) {
                manager.setTorchMode(backId, torchOn);
                status.setText(torchOn ? "Torch on." : "Torch off.");
            }
        } catch (CameraAccessException e) {
            status.setText("Torch failed: " + e.getMessage());
        }
    }

    private String findCameraId(int desiredFacing) {
        try {
            for (String id : manager.getCameraIdList()) {
                CameraCharacteristics chars = manager.getCameraCharacteristics(id);
                Integer f = chars.get(CameraCharacteristics.LENS_FACING);
                if (f != null && f == desiredFacing) return id;
            }
        } catch (CameraAccessException ignored) {}
        return null;
    }

    private Size chooseSize(Size[] sizes, int maxWidth, int maxHeight) {
        if (sizes == null || sizes.length == 0) return null;
        List<Size> list = new ArrayList<>(Arrays.asList(sizes));
        Collections.sort(list, (a, b) -> Long.compare(
                (long) a.getWidth() * a.getHeight(),
                (long) b.getWidth() * b.getHeight()));
        Size best = list.get(0);
        for (Size s : list) {
            if (s.getWidth() <= maxWidth && s.getHeight() <= maxHeight) best = s;
        }
        return best;
    }

    private void closeCamera() {
        try {
            if (!openCloseLock.tryAcquire(2500, java.util.concurrent.TimeUnit.MILLISECONDS)) {
                return;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }
        try {
            if (session != null) {
                session.close();
                session = null;
            }
            if (cameraDevice != null) {
                cameraDevice.close();
                cameraDevice = null;
            }
            if (imageReader != null) {
                imageReader.close();
                imageReader = null;
            }
            previewBuilder = null;
            if (torchOn) {
                try {
                    String backId = findCameraId(CameraCharacteristics.LENS_FACING_BACK);
                    if (backId != null) manager.setTorchMode(backId, false);
                } catch (Exception ignored) {}
                torchOn = false;
            }
        } finally {
            openCloseLock.release();
        }
    }

    private void startBackgroundThread() {
        backgroundThread = new HandlerThread("pawd-camera");
        backgroundThread.start();
        backgroundHandler = new Handler(backgroundThread.getLooper());
    }

    private void stopBackgroundThread() {
        if (backgroundThread == null) return;
        backgroundThread.quitSafely();
        try {
            backgroundThread.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        backgroundThread = null;
        backgroundHandler = null;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_CAMERA) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (granted && textureView.isAvailable()) openCamera();
            else if (!granted) status.setText("Camera permission denied.");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        startBackgroundThread();
        if (textureView.isAvailable()) openCamera();
    }

    @Override
    protected void onPause() {
        closeCamera();
        stopBackgroundThread();
        super.onPause();
    }
}
