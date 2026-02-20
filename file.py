import random                                                                                                                                                                    
  import sys                                                                                                                                                                       
                                                                                                                                                                                   
                                                                                                                                                                                   
  def generate_maze(width: int, height: int) -> list[list[str]]:                                                                                                                   
      maze = [["#"] * (2 * width + 1) for _ in range(2 * height + 1)]                                                                                                              
      visited: set[tuple[int, int]] = set()                                                                                                                                        
                                                                                                                                                                                   
      def dfs(x: int, y: int) -> None:                                                                                                                                             
          visited.add((x, y))                                                                                                                                                      
          maze[2 * y + 1][2 * x + 1] = " "                                                                                                                                         
          directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]                                                                                                                          
          random.shuffle(directions)                                                                                                                                               
          for dx, dy in directions:                                                                                                                                                
              nx, ny = x + dx, y + dy                                                                                                                                              
              if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:                                                                                                 
                  maze[y + ny + 1][x + nx + 1] = " "                                                                                                                               
                  dfs(nx, ny)                                                                                                                                                      
                                                                                                                                                                                   
      dfs(0, 0)                                                                                                                                                                    
      maze[1][0] = " "                                                                                                                                                             
      maze[2 * height - 1][2 * width] = " "                                                                                                                                        
      return maze                                                                                                                                                                  
                                                                                                                                                                                   
                                                                                                                                                                                   
  def print_maze(maze: list[list[str]]) -> None:                                                                                                                                   
      for row in maze:                                                                                                                                                             
          print("".join(row))                                                                                                                                                      
                                                                                                                                                                                   
                                                                                                                                                                                   
  def solve_maze(maze: list[list[str]]) -> list[tuple[int, int]] | None:                                                                                                           
      start = (0, 1)                                                                                                                                                               
      end = (len(maze[0]) - 1, len(maze) - 2)                                                                                                                                      
      stack: list[tuple[int, int, list[tuple[int, int]]]] = [(start[0], start[1], [start])]                                                                                        
      visited: set[tuple[int, int]] = {start}                                                                                                                                      
                                                                                                                                                                                   
      while stack:                                                                                                                                                                 
          x, y, path = stack.pop()                                                                                                                                                 
          if (x, y) == end:                                                                                                                                                        
              return path                                                                                                                                                          
          for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:                                                                                                                        
              nx, ny = x + dx, y + dy                                                                                                                                              
              if (                                                                                                                                                                 
                  0 <= nx < len(maze[0])                                                                                                                                           
                  and 0 <= ny < len(maze)                                                                                                                                          
                  and maze[ny][nx] == " "                                                                                                                                          
                  and (nx, ny) not in visited                                                                                                                                      
              ):                                                                                                                                                                   
                  visited.add((nx, ny))                                                                                                                                            
                  stack.append((nx, ny, path + [(nx, ny)]))                                                                                                                        
                                                                                                                                                                                   
      return None                                                                                                                                                                  
                                                                                                                                                                                   
                                                                                                                                                                                   
  def display_solved(maze: list[list[str]], path: list[tuple[int, int]]) -> None:                                                                                                  
      solved = [row[:] for row in maze]                                                                                                                                            
      for x, y in path:                                                                                                                                                            
          if solved[y][x] == " ":                                                                                                                                                  
              solved[y][x] = "."                                                                                                                                                   
      for row in solved:                                                                                                                                                           
          print("".join(row))                                                                                                                                                      
                                                                                                                                                                                   
                                                                                                                                                                                   
  def main() -> None:                                                                                                                                                              
      width = int(sys.argv[1]) if len(sys.argv) > 1 else 15                                                                                                                        
      height = int(sys.argv[2]) if len(sys.argv) > 2 else 10                                                                                                                       
                                                                                                                                                                                   
      print(f"Generating {width}x{height} maze...\n")                                                                                                                              
      maze = generate_maze(width, height)                                                                                                                                          
      print_maze(maze)                                                                                                                                                             
                                                                                                                                                                                   
      print("\nSolving...\n")                                                                                                                                                      
      path = solve_maze(maze)                                                                                                                                                      
      if path:                                                                                                                                                                     
          display_solved(maze, path)                                                                                                                                               
          print(f"\nPath length: {len(path)} steps")                                                                                                                               
      else:                                                                                                                                                                        
          print("No solution found.")                                                                                                                                              
                                                                                                                                                                                   
                                                                                                                                                                                   
  if __name__ == "__main__":                                                                                                                                                       
      main()                                                                                                                                                                       