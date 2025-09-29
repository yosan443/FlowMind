# FlowMind: A Visual AI Workflow Builder - Components Documentation

## Overview

This document provides an overview of the key components used in the FlowMind application. Each component plays a crucial role in building and managing visual AI workflows.

## Components

### 1. Canvas
- **Location**: `src/client/components/Canvas/Canvas.tsx`
- **Description**: The Canvas component serves as the main workspace where users can visually construct their workflows. It allows users to drag and drop nodes, connect them, and visualize the flow of data.

### 2. NodePanel
- **Location**: `src/client/components/NodePanel/NodePanel.tsx`
- **Description**: The NodePanel component displays a sidebar with available nodes that users can add to the Canvas. It provides a user-friendly interface for selecting different types of nodes to include in workflows.

### 3. WorkflowInspector
- **Location**: `src/client/components/WorkflowInspector/WorkflowInspector.tsx`
- **Description**: The WorkflowInspector component allows users to view and edit the details of the selected workflow. It provides insights into the configuration of each node and the overall structure of the workflow.

## Additional Notes
- Each component is styled using CSS modules to ensure encapsulated styles and prevent conflicts.
- The components are designed to be reusable and composable, allowing for a flexible workflow-building experience.

## Conclusion
The components outlined in this document are integral to the functionality of the FlowMind application, enabling users to create, manage, and visualize AI workflows effectively.