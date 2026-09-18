import sys
from PIL import Image

def flood_fill_transparency(input_path, output_path, tolerance=30):
    print(f"Flood filling corners of {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        pixels = img.load()
        width, height = img.size
        
        # Get the color of the top-left corner
        target_color = pixels[0, 0]
        
        # We want to replace it with transparent
        replacement_color = (0, 0, 0, 0)
        
        def color_diff(c1, c2):
            return abs(c1[0]-c2[0]) + abs(c1[1]-c2[1]) + abs(c1[2]-c2[2])
            
        queue = [(0,0), (width-1, 0), (0, height-1), (width-1, height-1)]
        visited = set(queue)
        
        while queue:
            x, y = queue.pop(0)
            
            # If color is within tolerance
            if color_diff(pixels[x, y], target_color) <= tolerance * 3:
                pixels[x, y] = replacement_color
                
                # Add neighbors
                for dx, dy in [(0,1), (1,0), (0,-1), (-1,0)]:
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if (nx, ny) not in visited:
                            visited.add((nx, ny))
                            queue.append((nx, ny))
                            
        img.save(output_path, "PNG")
        print(f"Successfully saved to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    flood_fill_transparency(sys.argv[1], sys.argv[2], tolerance=40)
