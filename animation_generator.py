"""
First Order Model Integration for Face Animation
This module handles the integration with the First Order Model from:
https://github.com/AliaksandrSiarohin/first-order-model

Prerequisites:
1. Clone the first-order-model repository
2. Download pre-trained models
3. Install required dependencies: torch, torchvision, imageio, scikit-image, etc.
"""

import os
import sys
import yaml
import imageio
import numpy as np
from skimage import img_as_ubyte
from skimage.transform import resize
import torch
from scipy.spatial import ConvexHull
import warnings
warnings.filterwarnings("ignore")

# Add first-order-model to path
FIRST_ORDER_MODEL_PATH = './first-order-model'
sys.path.insert(0, FIRST_ORDER_MODEL_PATH)

try:
    from demo import load_checkpoints, make_animation
    from modules.generator import OcclusionAwareGenerator
    from modules.keypoint_detector import KPDetector
except ImportError:
    print("Warning: First Order Model not found. Please clone the repository.")

class FaceAnimationGenerator:
    def __init__(self, config_path='./first-order-model/config/vox-256.yaml',
                 checkpoint_path='./first-order-model/checkpoints/vox-cpk.pth.tar'):
        """
        Initialize the Face Animation Generator
        
        Args:
            config_path: Path to the model configuration file
            checkpoint_path: Path to the pre-trained model checkpoint
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {self.device}")
        
        try:
            # Load configuration
            with open(config_path) as f:
                self.config = yaml.safe_load(f)
            
            # Load checkpoint
            self.generator, self.kp_detector = load_checkpoints(
                config_path=config_path,
                checkpoint_path=checkpoint_path,
                device=self.device
            )
            
            self.generator.eval()
            self.kp_detector.eval()
            
            print("Model loaded successfully!")
        
        except Exception as e:
            print(f"Error loading model: {e}")
            self.generator = None
            self.kp_detector = None
    
    def generate_animation(self, source_image_path, driving_video_path, output_path, 
                          relative=True, adapt_movement_scale=True, cpu=False):
        """
        Generate animation from source image and driving video
        
        Args:
            source_image_path: Path to the source image (avatar)
            driving_video_path: Path to the driving video
            output_path: Path to save the output video
            relative: Use relative or absolute keypoint coordinates
            adapt_movement_scale: Adapt movement scale based on convex hull
            cpu: Use CPU instead of GPU
        
        Returns:
            str: Path to the generated animation
        """
        if self.generator is None or self.kp_detector is None:
            raise Exception("Model not loaded. Please check the setup.")
        
        try:
            # Read source image
            source_image = imageio.imread(source_image_path)
            source_image = resize(source_image, (256, 256))[..., :3]
            
            # Read driving video
            reader = imageio.get_reader(driving_video_path)
            fps = reader.get_meta_data()['fps']
            driving_video = []
            
            try:
                for im in reader:
                    driving_video.append(im)
            except RuntimeError:
                pass
            
            reader.close()
            
            # Resize driving video
            driving_video = [resize(frame, (256, 256))[..., :3] for frame in driving_video]
            
            # Generate predictions
            predictions = make_animation(
                source_image, 
                driving_video, 
                self.generator, 
                self.kp_detector,
                relative=relative,
                adapt_movement_scale=adapt_movement_scale,
                cpu=cpu
            )
            
            # Save output
            imageio.mimsave(output_path, [img_as_ubyte(frame) for frame in predictions], fps=fps)
            
            print(f"Animation saved to: {output_path}")
            return output_path
        
        except Exception as e:
            print(f"Error generating animation: {e}")
            raise e
    
    def generate_expression_animation(self, source_image_path, expression_type, output_path):
        """
        Generate animation with predefined expression
        
        Args:
            source_image_path: Path to the source image
            expression_type: Type of expression (smile, angry, surprised, sad)
            output_path: Path to save the output
        
        Returns:
            str: Path to the generated animation
        """
        # Map expression types to driving videos
        expression_videos = {
            'smile': './expressions/smile.mp4',
            'angry': './expressions/angry.mp4',
            'surprised': './expressions/surprised.mp4',
            'sad': './expressions/sad.mp4'
        }
        
        if expression_type not in expression_videos:
            raise ValueError(f"Unknown expression type: {expression_type}")
        
        driving_video_path = expression_videos.get(expression_type)
        
        if not os.path.exists(driving_video_path):
            raise FileNotFoundError(f"Expression video not found: {driving_video_path}")
        
        return self.generate_animation(source_image_path, driving_video_path, output_path)


# Utility functions for Flask integration
def setup_first_order_model():
    """
    Setup function to download and prepare the First Order Model
    Run this once during initial setup
    """
    import subprocess
    
    print("Setting up First Order Model...")
    
    # Clone repository if not exists
    if not os.path.exists(FIRST_ORDER_MODEL_PATH):
        print("Cloning first-order-model repository...")
        subprocess.run([
            'git', 'clone', 
            'https://github.com/AliaksandrSiarohin/first-order-model.git'
        ])
    
    # Download checkpoint
    checkpoint_dir = os.path.join(FIRST_ORDER_MODEL_PATH, 'checkpoints')
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    checkpoint_file = os.path.join(checkpoint_dir, 'vox-cpk.pth.tar')
    
    if not os.path.exists(checkpoint_file):
        print("Downloading pre-trained model...")
        subprocess.run([
            'wget', 
            'https://cloud.tsinghua.edu.cn/f/00c0c9f0f9c04f5da14e/?dl=1',
            '-O', checkpoint_file
        ])
    
    print("Setup complete!")


def process_animation_task(avatar_path, expression_or_video, output_path, task_type='expression'):
    """
    Process animation generation task
    
    Args:
        avatar_path: Path to the avatar image
        expression_or_video: Expression type or path to driving video
        output_path: Path to save output
        task_type: 'expression' or 'custom'
    
    Returns:
        dict: Result with status and output path
    """
    try:
        generator = FaceAnimationGenerator()
        
        if task_type == 'expression':
            result_path = generator.generate_expression_animation(
                avatar_path, 
                expression_or_video, 
                output_path
            )
        else:
            result_path = generator.generate_animation(
                avatar_path,
                expression_or_video,
                output_path
            )
        
        return {
            'status': 'success',
            'output_path': result_path,
            'message': 'Animation generated successfully'
        }
    
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
            'message': 'Animation generation failed'
        }


# Example usage
if __name__ == '__main__':
    # Setup (run once)
    # setup_first_order_model()
    
    # Test generation
    generator = FaceAnimationGenerator()
    
    # Generate with expression
    result = generator.generate_expression_animation(
        source_image_path='./test_avatar.jpg',
        expression_type='smile',
        output_path='./test_output.mp4'
    )
    
    print(f"Generated: {result}")