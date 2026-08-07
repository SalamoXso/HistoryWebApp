import os
import sys
from pathlib import Path
from datetime import datetime
from fpdf import FPDF
import fnmatch

class PDFReport(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Folder Structure and Code Report', 0, 1, 'C')
        self.ln(5)
        
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

class FolderScanner:
    def __init__(self, root_path):
        self.root_path = Path(root_path)
        self.ignore_patterns = [
            # Node modules and related
            'node_modules',
            'package-lock.json',
            'yarn.lock',
            'pnpm-lock.yaml',
            '.npm',
            '.yarn',
            
            # Python related
            '__pycache__',
            '*.pyc',
            '*.pyo',
            '*.pyd',
            'venv',
            'env',
            '.venv',
            '.env',
            '*.egg-info',
            'dist',
            'build',
            '.pytest_cache',
            '.coverage',
            'htmlcov',
            
            # Version control
            '.git',
            '.svn',
            '.hg',
            '.gitignore',
            '.gitattributes',
            
            # IDE and editor
            '.vscode',
            '.idea',
            '.vs',
            '*.swp',
            '*.swo',
            '*~',
            '.DS_Store',
            'Thumbs.db',
            
            # Build and dependency
            'vendor',
            'bower_components',
            'jspm_packages',
            '*.min.js',
            '*.min.css',
            '*.map',
            
            # Logs and temp
            '*.log',
            '*.tmp',
            '*.temp',
            'logs',
            'tmp',
            'temp',
            
            # Large and binary files
            '*.exe',
            '*.dll',
            '*.so',
            '*.dylib',
            '*.bin',
            '*.jpg',
            '*.jpeg',
            '*.png',
            '*.gif',
            '*.bmp',
            '*.ico',
            '*.mp4',
            '*.mp3',
            '*.wav',
            '*.avi',
            '*.mkv',
            '*.pdf',
            '*.zip',
            '*.tar',
            '*.gz',
            '*.rar',
            '*.7z',
            
            # Specific project files
            'composer.lock',
            'Gemfile.lock',
            'poetry.lock',
            'Cargo.lock',
            'go.sum'
        ]
        
        self.binary_extensions = {
            '.exe', '.dll', '.so', '.dylib', '.bin',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico',
            '.mp4', '.mp3', '.wav', '.avi', '.mkv',
            '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
            '.pyc', '.pyo', '.pyd', '.class', '.jar', '.war',
            '.ear', '.par', '.sar', '.o', '.obj', '.lib'
        }
        
        self.text_extensions = {
            '.txt', '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.htm',
            '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml',
            '.yml', '.toml', '.ini', '.cfg', '.conf', '.md', '.markdown',
            '.rst', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
            '.c', '.cpp', '.cxx', '.h', '.hpp', '.hxx', '.java', '.kt',
            '.kts', '.scala', '.go', '.rs', '.swift', '.m', '.mm',
            '.php', '.rb', '.pl', '.pm', '.lua', '.r', '.dart',
            '.dockerfile', '.makefile', '.cmake', '.gradle', '.groovy'
        }
        
        self.max_file_size = 1024 * 1024  # 1MB max file size to read
    
    def should_ignore(self, path):
        """Check if path should be ignored based on patterns"""
        path_str = str(path)
        name = path.name
        
        # Check if path contains any ignore pattern
        for pattern in self.ignore_patterns:
            if '*' in pattern:
                if fnmatch.fnmatch(name, pattern):
                    return True
            elif pattern in path_str.split(os.sep):
                return True
        
        return False
    
    def is_binary_file(self, file_path):
        """Check if file is binary based on extension"""
        return file_path.suffix.lower() in self.binary_extensions
    
    def is_text_file(self, file_path):
        """Check if file is text based on extension"""
        return file_path.suffix.lower() in self.text_extensions
    
    def read_file_content(self, file_path):
        """Read file content if it's a text file and not too large"""
        if self.is_binary_file(file_path):
            return "[Binary file - content not displayed]"
        
        try:
            if file_path.stat().st_size > self.max_file_size:
                return f"[File too large ({file_path.stat().st_size} bytes) - content not displayed]"
            
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        return f.read()
                except UnicodeDecodeError:
                    continue
            
            return "[Unable to decode file - binary or unsupported encoding]"
            
        except Exception as e:
            return f"[Error reading file: {str(e)}]"
    
    def get_structure(self):
        """Get folder structure and file contents"""
        structure = {
            'tree': [],
            'files': {}
        }
        
        for root, dirs, files in os.walk(self.root_path):
            # Remove ignored directories
            dirs[:] = [d for d in dirs if not self.should_ignore(Path(root) / d)]
            
            # Filter files
            relative_root = Path(root).relative_to(self.root_path)
            
            # Add directory to tree
            if relative_root != Path('.'):
                structure['tree'].append(f"📁 {relative_root}")
            
            # Process files
            for file in files:
                file_path = Path(root) / file
                if self.should_ignore(file_path):
                    continue
                
                relative_path = file_path.relative_to(self.root_path)
                structure['tree'].append(f"  📄 {relative_path}")
                
                # Read file content if text
                if self.is_text_file(file_path) or file_path.suffix == '':
                    content = self.read_file_content(file_path)
                    if content and not content.startswith('['):
                        structure['files'][str(relative_path)] = content
                elif not self.is_binary_file(file_path):
                    # Try to read as text even if extension not in text_extensions
                    content = self.read_file_content(file_path)
                    if content and not content.startswith('['):
                        structure['files'][str(relative_path)] = content
        
        return structure
    
    def generate_pdf(self, structure, output_file):
        """Generate PDF with folder structure and file contents"""
        pdf = PDFReport()
        pdf.add_page()
        pdf.set_font('Arial', '', 10)
        
        # Title and metadata
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, f'Project Structure Report', 0, 1, 'C')
        pdf.set_font('Arial', '', 10)
        pdf.cell(0, 5, f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'C')
        pdf.cell(0, 5, f'Root: {self.root_path.absolute()}', 0, 1, 'C')
        pdf.ln(5)
        
        # Folder structure
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 8, 'FOLDER STRUCTURE', 0, 1, 'L')
        pdf.set_font('Courier', '', 9)
        
        for item in structure['tree']:
            # Check if we need a new page
            if pdf.get_y() > 250:
                pdf.add_page()
                pdf.set_font('Courier', '', 9)
            
            # Clean and encode the item text
            clean_text = item.encode('latin-1', 'ignore').decode('latin-1')
            pdf.cell(0, 5, clean_text, 0, 1, 'L')
        
        # File contents
        if structure['files']:
            pdf.add_page()
            pdf.set_font('Arial', 'B', 12)
            pdf.cell(0, 8, 'FILE CONTENTS', 0, 1, 'L')
            pdf.ln(2)
            
            for file_path, content in structure['files'].items():
                # Check if we need a new page
                if pdf.get_y() > 250:
                    pdf.add_page()
                    pdf.set_font('Arial', 'B', 12)
                    pdf.cell(0, 8, 'FILE CONTENTS (continued)', 0, 1, 'L')
                    pdf.ln(2)
                
                # File name
                pdf.set_font('Arial', 'B', 10)
                clean_filename = file_path.encode('latin-1', 'ignore').decode('latin-1')
                pdf.set_fill_color(240, 240, 240)
                pdf.cell(0, 8, f'File: {clean_filename}', 0, 1, 'L', 1)
                
                # File content
                pdf.set_font('Courier', '', 8)
                
                # Split content into lines to handle long lines
                lines = content.split('\n')
                for line in lines:
                    if pdf.get_y() > 250:
                        pdf.add_page()
                        pdf.set_font('Courier', '', 8)
                    
                    # Encode and handle special characters
                    clean_line = line.encode('latin-1', 'ignore').decode('latin-1')
                    # Truncate long lines if necessary
                    if len(clean_line) > 100:
                        # Try to wrap long lines
                        for i in range(0, len(clean_line), 100):
                            chunk = clean_line[i:i+100]
                            pdf.cell(0, 4, chunk, 0, 1, 'L')
                    else:
                        pdf.cell(0, 4, clean_line, 0, 1, 'L')
                
                pdf.ln(2)
        
        # Save the PDF
        pdf.output(output_file)
        print(f"✅ PDF generated successfully: {output_file}")
        print(f"📊 Total files processed: {len(structure['files'])}")

def main():
    # Get the current directory or specified path
    if len(sys.argv) > 1:
        root_path = sys.argv[1]
    else:
        root_path = os.getcwd()
    
    if not os.path.exists(root_path):
        print(f"❌ Error: Path '{root_path}' does not exist")
        sys.exit(1)
    
    print(f"📂 Scanning folder: {root_path}")
    print("⏳ This may take a moment for large projects...")
    
    # Create scanner and generate report
    scanner = FolderScanner(root_path)
    structure = scanner.get_structure()
    
    # Generate PDF filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"folder_structure_report_{timestamp}.pdf"
    
    scanner.generate_pdf(structure, output_file)
    
    print("\n📋 Summary:")
    print(f"   - Total items in structure: {len(structure['tree'])}")
    print(f"   - Total files with content: {len(structure['files'])}")

if __name__ == "__main__":
    main()