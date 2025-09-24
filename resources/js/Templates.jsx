import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
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
import SwitchFormGroup from './components/form/SwitchFormGroup.jsx'
import EditorFormGroup from './components/form/EditorFormGroup.jsx'
import { Editor } from '@tinymce/tinymce-react'
import { Clipboard } from 'sode-extend-react'
import { renderToString } from 'react-dom/server'
import SendingModal from './Reutilizables/Templates/SendingModal.jsx'
import RepositoryRest from './actions/RepositoryRest.js'
import Global from './Utils/Global.js'

const templatesRest = new TemplatesRest()
const repositoryRest = new RepositoryRest()

const Templates = ({ TINYMCE_KEY, sessions }) => {

  const gridRef = useRef()
  const modalRef = useRef()
  const whatsappModalRef = useRef()
  const sendingModalRef = useRef()
  const ddRef = useRef()

  const tinyEditorRef = useRef()
  const codeEditorRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const typeRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const messageRef = useRef()
  const attachmentRef = useRef()
  const attachmentUrlRef = useRef()

  const [dataLoaded, setDataLoaded] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDesigning, setIsDesigning] = useState(false)
  const [templateActive, setTemplateActive] = useState({})
  const [typeEdition, setTypeEdition] = useState('wysiwyg')

  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState(null)

  // Content Statuses
  const [wysiwygContent, setWysiwygContent] = useState('')
  const [codeContent, setCodeContent] = useState('')
  const [dropzoneContent, setDropzoneContent] = useState('')

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    $(typeRef.current).val(data?.type || null).trigger('change')
    nameRef.current.value = data?.name || null
    descriptionRef.current.value = data?.description || null

    $(modalRef.current).modal('show')
  }

  const onWhatsAppModalOpen = async (data) => {
    const result = await templatesRest.get(data.id)
    setTemplateActive(result)
    messageRef.current.value = result?.content || ''
    setMessage(result?.content || '')
    attachmentRef.current.value = ''
    attachmentUrlRef.current.value = ''
    attachmentUrlRef.current.originalValue = ''
    if (result?.attachment) setAttachment(result.attachment)
    else setAttachment(null)

    $(whatsappModalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value,
      type: typeRef.current.value,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
    }

    const result = await templatesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDesignModalSubmit = async (e) => {
    e.preventDefault()

    const content = typeEdition == 'wysiwyg' ? wysiwygContent : typeEdition == 'code' ? codeContent : dropzoneContent

    const request = {
      id: templateActive.id,
      content,
      vars: content.match(/{{([^}]+)}}/g)?.map(match => match.slice(2, -2)) || [],
    }

    const result = await templatesRest.save(request)
    if (!result) return
  }

  const onWhatsAppModalSubmit = async (e) => {
    e.preventDefault()

    let attachment = null
    if (attachmentRef.current.files.length > 0) {
      const formData = new FormData()
      formData.append('file', attachmentRef.current.files[0])
      const result = await repositoryRest.save(formData)
      attachment = result.url
    } else if (attachmentUrlRef.current.value) {
      try {
        const response = await fetch(attachmentUrlRef.current.value)
        if (!response.ok) throw new Error('Failed to fetch image')

        const blob = await response.blob()
        const file = new File([blob], 'attachment', { type: blob.type })
        const formData = new FormData()
        formData.append('file', file)
        const result = await repositoryRest.save(formData)
        attachment = result.url
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error al obtener el adjunto',
          text: 'No se pudo obtener el archivo adjunto desde la URL proporcionada. Por favor, intente descargar el archivo desde su navegador y súbalo como archivo adjunto.',
          confirmButtonText: 'Entendido'
        })
        return
      }
    }

    const content = messageRef.current.value
    const request = {
      id: templateActive.id,
      content,
      attachment: attachment || undefined,
      vars: content.match(/{{([^}]+)}}/g)?.map(match => match.slice(2, -2)) || [],
    }

    const result = await templatesRest.save(request)
    if (!result) return

    $(whatsappModalRef.current).modal('hide')
  }

  const onSendingModalClicked = async (data) => {
    const result = await templatesRest.get(data.id)
    setDataLoaded(result)
  }
  const onEditorModalOpen = async (data) => {
    if (data.type === 'WhatsApp') {
      onWhatsAppModalOpen(data)
      return
    }

    const result = await templatesRest.get(data.id)
    setTemplateActive(result);
    setTypeEdition('wysiwyg')
    setWysiwygContent(result?.content ?? '<i>- Agrega tu contenido aqui -</i>');
    setIsDesigning(true)
  }

  useEffect(() => {
    Clipboard.paste(ddRef.current, (files) => {
      if (!files || files?.length == 0) return
      const file = files[0]
      if (!file.type.startsWith('text/')) return
      onDropzoneChange(files[0])
    })
  }, [null])

  const processWywiwygContent = async (newContent) => {
    const body = $(`<div>${newContent}</div>`)
    const imgs = body.find('img[src^="data:"]')

    if (imgs.length > 0) {
      for (const img of imgs) {
        const src = img.getAttribute('src');

        const base64Data = src.split(',')[1];
        const mimeType = src.split(',')[0].split(':')[1].split(';')[0];

        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays.push(byteCharacters.charCodeAt(i));
        }

        const byteArray = new Uint8Array(byteArrays);
        const file = new File([byteArray], `${crypto.randomUUID()}.${mimeType.split('/')[1]}`, { type: mimeType });

        const formData = new FormData()
        formData.append('file', file)
        const result = await repositoryRest.save(formData);
        const newSrc = result.url
        img.setAttribute('src', `https://temp.${Global.APP_DOMAIN}/${newSrc.replace('TEMP/', '')}`)
      }
      setWysiwygContent(body.html())
    } else {
      setWysiwygContent(newContent)
    }
  }

  useEffect(() => {
    if (!attachment) {
      setAttachmentPreview(null)
      return
    }

    // Check if attachment is a URL
    if (attachment.startsWith('TEMP/') || attachment.startsWith('http')) {
      fetch(attachment.startsWith('TEMP/') ? `/${attachment}` : attachment)
        .then(response => response.blob())
        .then(blob => {
          if (blob.type.startsWith('image/')) {
            setAttachmentPreview(URL.createObjectURL(blob))
          } else {
            setAttachmentPreview(null)
          }
        })
        .catch(() => setAttachmentPreview(null))
      return
    }

    // Check if attachment is a File object
    if (attachment instanceof File) {
      if (attachment.type.startsWith('image/')) {
        setAttachmentPreview(URL.createObjectURL(attachment))
      } else {
        setAttachmentPreview(null)
      }
      return
    }

    setAttachmentPreview(null)
  }, [attachment])

  return (<>
    <div hidden={isDesigning}>
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
            dataField: 'type',
            caption: 'Tipo'
          },
          {
            dataField: 'name',
            caption: 'Nombre',
            cellTemplate: (container, { data }) => {
              container.html(renderToString(<b>{data.name}</b>))
            }
          },
          {
            dataField: 'description',
            caption: 'Descripcion'
          },
          {
            dataField: 'status',
            caption: 'Estado',
            dataType: 'boolean',
            width: '120px',
            cellTemplate: (container, { data }) => {
              ReactAppend(container, <SwitchFormGroup checked={data.status} onChange={(e) => onStatusChange({ id: data.id, status: !e.target.checked })} />)
            },
          },
          {
            caption: 'Acciones',
            width: '180px',
            cellTemplate: (container, { data }) => {
              container.attr('style', 'display: flex; gap: 4px; overflow: unset')

              ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
                <i className='mdi mdi-pencil'></i>
              </TippyButton>)

              ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title='Diseñar plantilla' onClick={() => onEditorModalOpen(data)} data-loading-text='<i className="fa fa-spinner fa-spin"></i>'>
                <i className='mdi mdi-circle-edit-outline'></i>
              </TippyButton>)

              ReactAppend(container, <TippyButton className='btn btn-xs btn-white' title='Enviar mensajes masivos' onClick={() => onSendingModalClicked(data)}>
                <i className='mdi mdi-email-send'></i>
              </TippyButton>)

              ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
                <i className='mdi mdi-delete'></i>
              </TippyButton>)
            },
            allowFiltering: false,
            allowExporting: false
          }
        ]} />
    </div>
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
    <form className='row' onSubmit={onDesignModalSubmit} hidden={!isDesigning}>
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex gap-1 align-items-center justify-content-between">
            <div className='d-flex gap-1 align-items-center'>
              <button className='btn btn-white btn-xs rounded-pill' onClick={() => setIsDesigning(false)} type='button'>
                <i className='mdi mdi-chevron-left me-1'></i> Volver
              </button>
              <h4 className="header-title my-0">Diseñador de plantillas - {templateActive?.name}</h4>
            </div>
            <button className='btn btn-xs btn-success' type='submit'>
              <i className='mdi mdi-save me-1'></i>
              Guardar
            </button>
          </div>
          <div className="card-body">
            <ul className="nav nav-pills navtab-bg justify-content-center flex-wrap gap-1">
              <li className="nav-item">
                <a href="#wysiwyg-editor" className={`nav-link text-center ${typeEdition == 'wysiwyg' ? 'active' : ''}`} style={{
                  width: '200px'
                }} onClick={() => onTypeEditionClicked('wysiwyg')}>
                  <i className='mdi mdi-page-layout-header-footer me-1'></i>
                  Editor WYSIWYG
                </a>
              </li>
              <li className="nav-item">
                <a href="#code-editor" className={`nav-link text-center ${typeEdition == 'code' ? 'active' : ''}`} style={{
                  width: '200px'
                }} onClick={() => onTypeEditionClicked('code')}>
                  <i className='mdi mdi-code-tags me-1'></i>
                  Editor de codigo
                </a>
              </li>
              <li className="nav-item">
                <a href="#dropzone" className={`nav-link text-center ${typeEdition == 'dropzone' ? 'active' : ''}`} style={{
                  width: '200px'
                }} onClick={() => onTypeEditionClicked('dropzone')}>
                  <i className='mdi mdi-cloud-upload me-1'></i>
                  Carga tu archivo
                </a>
              </li>
            </ul>
            <div className="tab-content">
              <div className={`tab-pane ${typeEdition == 'wysiwyg' ? 'active' : ''}`} id="wysiwyg-editor">
                <Editor
                  apiKey={TINYMCE_KEY}
                  onInit={(_evt, editor) => tinyEditorRef.current = editor}
                  init={{
                    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                    toolbar: 'myDataButton myPreviewButton blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | align lineheight | tinycomments | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                    // menubar: false,
                    tinycomments_mode: 'embedded',
                    tinycomments_author: 'Author name',
                    height: '660px',
                    // Add these configurations
                    readonly: false,
                    table_tab_navigation: true,
                    table_default_attributes: {
                      border: '1'
                    },
                    table_appearance_options: true,
                    table_advtab: true,
                    table_cell_advtab: true,
                    table_row_advtab: true,
                  }}
                  tabIndex={1}
                  value={wysiwygContent}
                  onEditorChange={(newValue) => processWywiwygContent(newValue)}
                />
                <div className='mb-2'></div>
              </div>
              <div className={`tab-pane ${typeEdition == 'code' ? 'active' : ''}`} id="code-editor">
                <EditorFormGroup editorRef={codeEditorRef} onChange={e => setCodeContent(e.target.value)} />
              </div>
              <div className={`tab-pane ${typeEdition == 'dropzone' ? 'active' : ''}`} id="dropzone">
                <div ref={ddRef} className='d-flex align-items-center justify-content-center mb-2 border' style={{
                  height: '660px',
                  borderRadius: '10px'
                }}>
                  <div>

                    <input className='d-none' id='dropzone-file' type="file" accept='text/html,text/plain' onChange={(e) => {
                      e.preventDefault()
                      const files = [...e.target.files]
                      e.target.value = null
                      if (files.length == 0) return
                      onDropzoneChange(files[0])
                    }} />
                    <label htmlFor="dropzone-file" className='d-block mx-auto mb-2 btn btn-sm btn-white rounded-pill waves-effect' style={{
                      width: 'max-content'
                    }}>
                      <i className='mdi mdi-paperclip me-1'></i>
                      Seleccionar archivo
                    </label>
                    <label htmlFor="dropzone-file" className='d-block' style={{ cursor: 'pointer' }}>
                      Arrastra y suelta tu plantilla aquí, o haz clic para seleccionar tu archivo HTML.
                    </label>
                    {
                      dropzoneContent?.trim() &&
                      <button
                        className='d-block mx-auto mt-2 btn btn-sm btn-primary rounded-pill waves-effect'
                        onClick={() => {
                          const blob = new Blob([dropzoneContent], { type: 'text/html' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'template.html';
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                        type='button'
                      >
                        <i className='mdi mdi-download me-1'></i>
                        Descargar HTML
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>

    {/* WhatsApp Template Modal */}
    <Modal modalRef={whatsappModalRef} title="Diseñar plantilla WhatsApp" onSubmit={onWhatsAppModalSubmit} size='lg'>
      <div className="row">
        <div className="col-md-6">
          <div className="row">
            <TextareaFormGroup eRef={messageRef} label="Mensaje" required onChange={e => setMessage(e.target.value)} />
            <div className="col-12">
              <div className="form-group">
                <label className='form-label'>Adjunto (opcional)</label>
                <div className={`${attachment ? 'd-flex' : 'd-none'} align-items-center gap-2 border rounded p-2`}>
                  <i className="mdi mdi-file-document-outline"></i>
                  <span className="flex-grow-1">attachment</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-soft-danger"
                    onClick={() => setAttachment(null)}
                  >
                    <i className="mdi mdi-close"></i>
                  </button>
                </div>
                <div className={attachment ? 'd-none' : 'd-block'}>
                  <input ref={attachmentRef} type="file" className="form-control mb-2" onChange={e => setAttachment(URL.createObjectURL(e.target.files[0]))} />
                  <small className="text-muted form-label">O ingresa una URL:</small>
                  <input ref={attachmentUrlRef} type="url" className="form-control" placeholder="https://" onChange={e => setAttachment(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <ul className="conversation-list slimscroll rounded" style={{ maxHeight: '410px', backgroundColor: '#ebeff2' }} data-simplebar="init">
            <div className="simplebar-wrapper" style={{ margin: '0px' }} bis_skin_checked="1">
              <div className="simplebar-height-auto-observer-wrapper" bis_skin_checked="1">
                <div className="simplebar-height-auto-observer" bis_skin_checked="1">
                </div>
              </div>
              <div className="simplebar-mask" bis_skin_checked="1">
                <div className="simplebar-offset" style={{ right: '0px', bottom: '0px' }} bis_skin_checked="1">
                  <div className="simplebar-content-wrapper" style={{ height: 'auto', overflow: 'hidden scroll' }} bis_skin_checked="1">
                    <div className="simplebar-content" style={{ padding: '0px' }} bis_skin_checked="1">
                      <li>
                        <div className="message-list mt-2" bis_skin_checked="1">
                          <div className="conversation-text" bis_skin_checked="1">
                            <div className="ctext-wrap" bis_skin_checked="1">
                              <p>
                                Hola!
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>

                      <li className="odd">
                        <div className="message-list" bis_skin_checked="1">
                          <div className="conversation-text" bis_skin_checked="1">
                            <div className="ctext-wrap" bis_skin_checked="1" style={{ backgroundColor: '#fff' }}>
                              {attachmentPreview ? (
                                <div className="attachment-preview mb-2">
                                  <img src={attachmentPreview} alt="Preview" className="img-fluid rounded w-100" style={{ maxHeight: '200px', objectFit: 'cover', objectPosition: 'center' }} />
                                </div>
                              ) : attachment && (
                                <div className="attachment-preview mb-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                  <div className="d-flex align-items-center justify-content-between gap-2 bg-light rounded p-2">
                                    <i className="mdi mdi-file-document-outline text-primary"></i>
                                    <span className="flex-grow-1 text-truncate text-start">attachment</span>
                                    <i className="mdi mdi-download text-muted"></i>
                                  </div>
                                </div>
                              )}
                              <p>{message}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    </div>
                  </div>
                </div>
              </div>
              <div className="simplebar-placeholder" style={{ width: 'auto', height: '606px' }} bis_skin_checked="1"> </div>
            </div>
            <div className="simplebar-track simplebar-horizontal" style={{ visibility: 'hidden' }} bis_skin_checked="1">
              <div className="simplebar-scrollbar" style={{ width: '0px', display: 'none' }} bis_skin_checked="1"></div>
            </div>
            <div className="simplebar-track simplebar-vertical" style={{ visibility: 'visible' }} bis_skin_checked="1">
              <div className="simplebar-scrollbar" style={{ height: '277px', transform: 'translate3d(0px, 133px, 0px); display: block' }} bis_skin_checked="1"></div>
            </div>
          </ul>
        </div>
      </div>
    </Modal>
    <SendingModal modalRef={sendingModalRef} dataLoaded={dataLoaded} setDataLoaded={setDataLoaded} sessions={sessions} />
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