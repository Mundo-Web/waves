
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import PermissionsRest from './actions/PermissionsRest.js'
import RolesRest from './actions/RolesRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import Swal from 'sweetalert2'
import TemplatesRest from './actions/TemplatesRest.js'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import EditorFormGroup from './components/form/EditorFormGroup.jsx'
import { Editor } from '@tinymce/tinymce-react'

const templatesRest = new TemplatesRest()

const Templates = ({ }) => {

  const gridRef = useRef()
  const modalRef = useRef()
  const designModalRef = useRef()
  const editorRef = useRef()
  const codeEditorRef = useRef()
  // const buttonPermissionsRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const typeRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [templateActive, setTemplateActive] = useState({})
  const [templateContent, setTemplateContent] = useState('')

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    $(typeRef.current).val(data?.type || null).trigger('change')
    nameRef.current.value = data?.name || null
    descriptionRef.current.value = data?.description || null

    $(modalRef.current).modal('show')
  }

  const onEditorModalOpen = async (data) => {
    const result = await templatesRest.get(data.id)
    setTemplateActive(result);
    setTemplateContent(result.content ?? '')
    $(designModalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      type: typeRef.current.value,
      name: nameRef.current.value,
      description: descriptionRef.current.value
    }

    const result = await templatesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDesignModalSubmit = async (e) => {
    e.preventDefault()

    const permissions = [...$('#permissions input:checked')].map(e => e.value)
    const request = {
      role_id: templateActive.id,
      permissions: permissions
    }

    const result = await PermissionsRest.massiveByRole(request)
    if (!result) return

    $(designModalRef.current).modal('hide')
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar rol',
      text: '¿Está seguro de eliminar este rol?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await RolesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  useEffect(() => {
    setTemplateContent(templateActive?.content ?? '')
    console.log(codeEditorRef)
  }, [templateActive])

  return (<>
    <Table gridRef={gridRef} title='Plantillas' rest={templatesRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-primary',
          text: 'Nuevo',
          title: 'Agregar registro',
          icon: 'fa fa-plus',
          onClick: () => onModalOpen()
        }))
      }}
      columns={[
        {
          dataField: 'name',
          caption: 'Nombre'
        },
        {
          dataField: 'description',
          caption: 'Descripcion'
        },
        {
          dataField: 'type',
          caption: 'Tipo',
        },
        {
          dataField: 'updated_at',
          caption: 'Fecha actualizacion',
          dataType: 'date',
          cellTemplate: (container, { data }) => {
            container.text(moment(data.updated_at).format('LL'))
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: unset')

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
              <i className='fa fa-pen'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title='Diseñar plantilla' onClick={() => onEditorModalOpen(data)} data-loading-text='<i className="fa fa-spinner fa-spin"></i>'>
              <i className='far fa-edit'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
              <i className='fa fa-trash-alt'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar plantilla' : 'Agregar plantilla'} onSubmit={onModalSubmit} size='sm'>
      <div className='row' id='template-container'>
        <input ref={idRef} type='hidden' />
        <SelectFormGroup eRef={typeRef} label='Tipo' dropdownParent='#template-container' required>
          <option value="">- Seleccione una opcion -</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
        </SelectFormGroup>
        <InputFormGroup eRef={nameRef} label='Nombre' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' />
      </div>
    </Modal>
    <Modal modalRef={designModalRef} title={`Diseñador de plantillas - ${templateActive.name}`} btnSubmitText='Guardar' onSubmit={onDesignModalSubmit} size='xl'>
      <ul className="nav nav-pills navtab-bg justify-content-center flex-wrap gap-1">
        <li className="nav-item">
          <a href="#wysiwyg-editor" data-bs-toggle="tab" aria-expanded="false" className="nav-link text-center active" style={{
            width: '200px'
          }}>
            Editor WYSIWYG
          </a>
        </li>
        <li className="nav-item">
          <a href="#code-editor" data-bs-toggle="tab" aria-expanded="true" className="nav-link text-center" style={{
            width: '200px'
          }}>
            Editor de codigo
          </a>
        </li>
        <li className="nav-item">
          <a href="#dropzone" data-bs-toggle="tab" aria-expanded="false" className="nav-link text-center" style={{
            width: '200px'
          }}>
            Carga tu archivo
          </a>
        </li>
      </ul>
      <div className="tab-content">
        <div className="tab-pane active" id="wysiwyg-editor">
          <Editor
            ref={editorRef}
            apiKey='to9eekrwr7478kpu5s95npp08yehwdh1o52wuuuo5n2msy8m'
            init={{
              plugins: [
                'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
              ],
              toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
              tinycomments_mode: 'embedded',
              tinycomments_author: 'Author name',
              mergetags_list: [
                { value: 'First.Name', title: 'First Name' },
                { value: 'Email', title: 'Email' },
              ],
              ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
              height: '600px',
            }}
            value={templateContent}
            onEditorChange={(newValue) => setTemplateContent(newValue)}
          />
          <div className='mb-2'></div>
        </div>
        <div className="tab-pane" id="code-editor">
          <EditorFormGroup editorRef={codeEditorRef} onChange={e => setTemplateContent(e.target.value)} />
        </div>
        <div className="tab-pane" id="dropzone">
          <div className='d-flex align-items-center justify-content-center mb-2 border' style={{
            height: '600px',
            borderRadius: '10px'
          }}>
            <div>
              <input className='d-none' id='dropzone-file' type="file" accept='text/html,text/plain' />
              <button className='d-block mx-auto mb-2 btn btn-sm btn-white rounded-pill waves-effect'>
                <i className='mdi mdi-paperclip me-1'></i>
                Seleccionar archivo
              </button>
              <label className='d-block' htmlFor="dropzone-file" style={{ cursor: 'pointer' }}>
                Arrastra y suelta tu plantilla aquí, o haz clic para seleccionar tu archivo HTML.
              </label>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Plantillas'>
      <Templates {...properties} />
    </Adminto>
  );
})