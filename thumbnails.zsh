#!/usr/bin/env zsh

# Generates thumbnails for reentry PDFs from S3 bucket.
# Saves to public/thumbnails since Vue builds require imports for assets,
# but these images are loaded conditionally.

readonly TEMP_DIR="temp_thumbnails"
readonly PAGE1_DIR="temp_thumbnails/page1_pdfs"
readonly THUMBNAILS_DIR="./public/thumbnails" 
readonly THUMBNAIL_SIZE="x600"

# Required dependencies
readonly DEPENDENCIES=(
    "qpdf:qpdf"
    "convert:imagemagick" 
    "gs:ghostscript"
)

# Check if a dependency command exists and display status
check_dependency() {
    local cmd="$1"
    local package="$2"
    
    if command -v "$cmd" &>/dev/null; then
        return 0
    else
        echo "❌ $cmd is not installed"
        return 1
    fi
}

# Verify all required dependencies are installed
verify_dependencies() {
    local missing_deps=()
    
    echo "🔍 Checking dependencies..."
    
    for dep in "${DEPENDENCIES[@]}"; do
        local cmd="${dep%%:*}"
        local package="${dep##*:}"
        
        if ! check_dependency "$cmd" "$package"; then
            missing_deps+=("$package")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo "❌ Missing: ${missing_deps[*]}"
        echo "💡 Install with: brew install ${missing_deps[*]}"
        exit 1
    fi
    
    echo "✅ Dependencies verified"
}

# Check if user is logged into AWS CLI
check_aws_auth() {
    echo "🔐 Verifying AWS credentials..."
    
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        echo "❌ AWS not configured"
        echo "💡 Run: aws configure"
        exit 1
    fi
    
    echo "✅ AWS authenticated"
}

# Check if thumbnails already exist for S3 files
check_existing_thumbnails() {
    echo "🔍 Checking for existing thumbnails..."
    
    # Get list of PDF files from S3
    local s3_files
    if ! s3_files=$(aws s3 ls s3://ithaka-jaip/test/jaip-collections/reentry/ | grep '\.pdf$' | awk '{print $4}'); then
        echo "❌ Failed to list S3 contents"
        exit 1
    fi
    
    if [[ -z "$s3_files" ]]; then
        echo "❌ No PDF files found in S3"
        exit 1
    fi
    
    # Check if thumbnails exist for all PDF files
    local missing_thumbnails=0
    local total_files=0
    
    while IFS= read -r pdf_file; do
        [[ -z "$pdf_file" ]] && continue
        ((total_files++))
        
        local thumbnail_name="${pdf_file%.pdf}.png"
        if [[ ! -f "$THUMBNAILS_DIR/$thumbnail_name" ]]; then
            ((missing_thumbnails++))
        fi
    done <<< "$s3_files"
    
    if [[ $missing_thumbnails -eq 0 && $total_files -gt 0 ]]; then
        echo "✅ All $total_files thumbnails already exist - no download needed"
        exit 0
    fi
    
    echo "📊 Found $total_files PDFs, $missing_thumbnails need thumbnails"
}

# Pull down S3 directory contents
pull_s3_directory() {
    echo "📥 Downloading PDFs from S3..."
    
    mkdir -p "$TEMP_DIR"
    
    if ! aws s3 cp s3://ithaka-jaip/test/jaip-collections/reentry/ "$TEMP_DIR" --recursive; then
        echo "❌ S3 download failed"
        cleanup
        exit 1
    fi
    
    # Check if any PDF files were downloaded
    if ! ls "$TEMP_DIR"/*.pdf >/dev/null 2>&1; then
        echo "❌ No PDFs found in S3"
        cleanup
        exit 1
    fi
    
    local pdf_count=$(ls "$TEMP_DIR"/*.pdf 2>/dev/null | wc -l)
    echo "✅ Downloaded $pdf_count PDFs"
}

# Process all PDFs in temp directory
process_all_pdfs() {
    echo "📄 Extracting first pages..."
    
    # Check if any PDF files exist in temp directory
    if ! ls "$TEMP_DIR"/*.pdf >/dev/null 2>&1; then
        echo "❌ No PDFs to process"
        exit 1
    fi
    
    local pdf_files=("$TEMP_DIR"/*.pdf)
    local success=0 failed=0
    
    for pdf_file in "${pdf_files[@]}"; do
        [[ -f "$pdf_file" ]] || continue
        if split_first_pdf_page "$pdf_file"; then
            ((success++))
        else
            ((failed++))
        fi
    done
    
    echo "✅ Processed: $success success, $failed failed"
}

# Extract first page from PDF
split_first_pdf_page() {
    local input_pdf="$1"
    local base_name="${input_pdf##*/}"  # Get just the filename
    local output_pdf="$PAGE1_DIR/${base_name%.pdf}_page1.pdf"
    
    mkdir -p "$PAGE1_DIR"
    
    if qpdf --empty --pages "$input_pdf" 1 -- "$output_pdf" 2>/dev/null; then
        return 0
    else
        echo "❌ Failed: $(basename "$input_pdf")"
        return 1
    fi
}

# Convert PDF to PNG thumbnail
create_thumbnail() {
    local pdf_file="$1"
    local base_name="${pdf_file##*/}"           # Get filename
    base_name="${base_name%_page1.pdf}"         # Remove suffix
    local output_file="$THUMBNAILS_DIR/${base_name}.png"
    
    # Skip if thumbnail already exists
    if [[ -f "$output_file" ]]; then
        echo "⏭️  Skipped: ${base_name}.png (exists)"
        return 0
    fi
    
    if convert "${pdf_file}[0]" -thumbnail "$THUMBNAIL_SIZE" -background white -alpha remove -alpha off "$output_file" 2>/dev/null; then
        echo "✅ Created: ${base_name}.png"
        return 0
    else
        echo "❌ Failed: ${base_name}.png"
        return 1
    fi
}

# Create thumbnails from all page 1 PDFs
create_thumbnails() {
    echo "🖼️  Creating thumbnails..."
    
    [[ ! -d "$PAGE1_DIR" ]] && { echo "❌ No extracted pages found"; exit 1; }
    
    mkdir -p "$THUMBNAILS_DIR"
    
    # Check if any page 1 PDF files exist
    if ! ls "$PAGE1_DIR"/*_page1.pdf >/dev/null 2>&1; then
        echo "❌ No pages to convert"
        exit 1
    fi
    
    local pdf_files=("$PAGE1_DIR"/*_page1.pdf)
    local success=0 failed=0
    
    for pdf_file in "${pdf_files[@]}"; do
        [[ -f "$pdf_file" ]] || continue
        if create_thumbnail "$pdf_file"; then
            ((success++))
        else
            ((failed++))
        fi
    done
    
    echo "✅ Created: $success thumbnails, $failed failed"
}

# Delete all temp files and directories
cleanup() {
    echo "🧹 Cleaning up..."
    rm -rf "$TEMP_DIR"
}

# Execute the workflow
run_make_thumbnails() {
    verify_dependencies
    check_aws_auth
    check_existing_thumbnails
    pull_s3_directory
    process_all_pdfs
    create_thumbnails
    cleanup
}

run_make_thumbnails