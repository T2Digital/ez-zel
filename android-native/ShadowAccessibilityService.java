package com.shadow.app;

import android.accessibilityservice.AccessibilityService;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

/**
 * Service to allow the Shadow Agent to have "Continuous Screen Awareness" 
 * without forcing the user to Accept a WebRTC prompt every time.
 * This reads the text and UI structure dynamically.
 */
public class ShadowAccessibilityService extends AccessibilityService {

    private static final String TAG = "ShadowVision";

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Only process window state changes or periodic content updates
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || 
            event.getEventType() == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            
            AccessibilityNodeInfo rootNode = getRootInActiveWindow();
            if (rootNode != null) {
                String screenText = extractTextFromNode(rootNode);
                if (!screenText.trim().isEmpty()) {
                    // Send this text to the LLM backend or background service 
                    // to determine context and decide if intervention is needed.
                    Log.d(TAG, "Screen Context Captured: " + screenText);
                }
                rootNode.recycle();
            }
        }
    }

    private String extractTextFromNode(AccessibilityNodeInfo node) {
        StringBuilder sb = new StringBuilder();
        if (node.getText() != null) {
            sb.append(node.getText()).append(" ");
        }
        if (node.getContentDescription() != null) {
            sb.append(node.getContentDescription()).append(" ");
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                sb.append(extractTextFromNode(child));
                child.recycle();
            }
        }
        return sb.toString();
    }

    @Override
    public void onInterrupt() {
        Log.e(TAG, "Shadow Accessibility Service Interrupted");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.i(TAG, "Shadow Screen Awareness Active (Accessibility Bridge)");
        // Perform initialization here, like connecting to the AI core.
    }
}
