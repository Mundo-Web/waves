import React, { useEffect, useRef } from 'react'

const TinyEditorFormGroup = ({ value, onChange, height = '600px' }) => {
  const editorRef = useRef()
  const elementRef = useRef()

  useEffect(() => {
    if (!window.tinymce) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.2/tinymce.min.js'
      script.onload = initializeTinyMCE
      document.body.appendChild(script)
    } else {
      initializeTinyMCE()
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value)
    }
  }, [value])

  const initializeTinyMCE = () => {
    window.tinymce.init({
      target: elementRef.current,
      plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
      toolbar: 'blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | align lineheight | tinycomments | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
      menubar: false,
      height,
      readonly: false,
      table_tab_navigation: true,
      table_default_attributes: {
        border: '1'
      },
      table_appearance_options: true,
      table_advtab: true,
      table_cell_advtab: true,
      table_row_advtab: true,
      setup: (editor) => {
        editorRef.current = editor
        editor.on('change', () => {
          onChange(editor.getContent())
        })
      }
    })
  }

  return <textarea ref={elementRef} defaultValue={value} />
}

export default TinyEditorFormGroup