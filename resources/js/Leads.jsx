import Tippy from '@tippyjs/react'
import Quill from 'quill'
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { GET, Local, String } from 'sode-extend-react'
import Swal from 'sweetalert2'
import '../css/leads.css'
import ClientNotesCard from './Reutilizables/ClientNotes/ClientNotesCard.jsx'
import TaskCard from './Reutilizables/Tasks/TaskCard.jsx'
import Correlative from './Utils/Correlative.js'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import ClientNotesRest from './actions/ClientNotesRest.js'
import LeadsRest from './actions/LeadsRest.js'
import TasksRest from './actions/TasksRest.js'
import UsersRest from './actions/UsersRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'

import "quill-mention/autoregister"
import SelectAPIFormGroup from './components/form/SelectAPIFormGroup.jsx'
import SetSelectValue from './Utils/SetSelectValue.jsx'
import ClientsRest from './actions/ClientsRest.js'
import Prepare2Send from './Utils/Prepare2Send.js'
import Send2Div from './Utils/Send2Div.js'
import Global from './Utils/Global.js'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import StatusDropdown from './Reutilizables/Statuses/StatusDropdown.jsx'
import Dropdown from './components/dropdown/DropDown.jsx'
import DropdownItem from './components/dropdown/DropdownItem.jsx'
import Number2Currency from './Utils/Number2Currency.jsx'
import ProductsByClients from './actions/ProductsByClientsRest.js'
import SimpleProductCard from './Reutilizables/Products/SimpleProductCard.jsx'
import { renderToString } from 'react-dom/server'
import googleSVG from './components/svg/google.svg'
import GmailRest from './actions/GmailRest.js'
import HtmlContent from './Utils/HtmlContent.jsx'
import MailingModal from './components/modals/MailingModal.jsx'
import FormatBytes from './Utils/FormatBytes.js'

const leadsRest = new LeadsRest()
const clientsRest = new ClientsRest()
const clientNotesRest = new ClientNotesRest()
const taskRest = new TasksRest()
const usetsRest = new UsersRest()
const productsByClients = new ProductsByClients()
const gmailRest = new GmailRest()

const Leads = ({ statuses: statusesFromDB, defaultClientStatus, defaultLeadStatus, manageStatuses: manageStatusesFromDB, noteTypes, products = [], processes = [], session: sessionDB, can, lead }) => {

  const modalRef = useRef()
  const newLeadModalRef = useRef()
  const gridRef = useRef()
  const composeModal = useRef()
  const mailModal = useRef()

  const taskTitleRef = useRef()
  // const taskEndsAtRef = useRef()
  const taskTypeRef = useRef()
  const taskPriorityRef = useRef()
  const taskAssignedToRef = useRef()
  const taskEndsAtDateRef = useRef()
  const taskEndsAtTimeRef = useRef()
  const processRef = useRef()
  const statusRef = useRef()
  const manageStatusRef = useRef()

  // Form Ref
  const idRef = useRef()
  const contactNameRef = useRef()
  const contactEmailRef = useRef()
  const contactPhoneRef = useRef()
  const nameRef = useRef()
  const webUrlRef = useRef()
  const messageRef = useRef()

  const [session, setSession] = useState(sessionDB)
  const [statuses, setStatuses] = useState(statusesFromDB);
  const [manageStatuses, setManageStatuses] = useState(manageStatusesFromDB)

  const [leads, setLeads] = useState([])
  const [leadLoaded, setLeadLoaded] = useState(null)
  const [notes, setNotes] = useState([]);
  const [defaultView, setDefaultView] = useState(Local.get('default-view') ?? 'kanban')
  const [clientProducts, setClientProducts] = useState([])
  const [hasGSToken, setHasGSToken] = useState(false)
  const [tokenUUID, setTokenUUID] = useState(crypto.randomUUID())
  const [googleAuthURI, setGoogleAuthURI] = useState(null)
  const [mails, setMails] = useState([]);
  const [loadingMails, setLoadingMails] = useState(false)
  const [inReplyTo, setInReplyTo] = useState(null)
  const [mailLoaded, setMailLoaded] = useState(null)

  const typeRefs = {};
  const idRefs = {}
  noteTypes.forEach(type => {
    typeRefs[type.id] = useRef()
    idRefs[type.id] = useRef()
  })

  useEffect(() => {
    $(modalRef.current).on('hidden.bs.modal', () => {
      setLeadLoaded(null)
      history.pushState(null, null, '/leads')
    });
    if (!lead) return

    leadsRest.get(lead).then(data => {
      if (!data) return
      setLeadLoaded(data)
      setNotes([])
      setClientProducts([])
      $(modalRef.current).modal('show')
      if (GET.annotation) {
        $(`[data-name="${GET.annotation}"]`).click()
      }
    })

    const input = processRef.current
    const dropdownMenu = new bootstrap.Dropdown(input);

    input.addEventListener('focus', function () {
      dropdownMenu.show();
    });
    input.addEventListener('blur', function () {
      setTimeout(() => {
        dropdownMenu.hide();
      }, 200);
    });

  }, [null])

  useEffect(() => {
    gmailRest.check().then(data => {
      if (data.authorized) return setHasGSToken(true)
      setGoogleAuthURI(data.auth_url)
    })
  }, [tokenUUID])

  useEffect(() => {
    if (!(hasGSToken && leadLoaded?.contact_email)) return
    setLoadingMails(true);
    setMails([])
    gmailRest.list(leadLoaded.contact_email).then(data => {
      setMails(data ?? [])
      setLoadingMails(false);
    })
  }, [hasGSToken, leadLoaded])

  useEffect(() => {
    const ids = statuses.map(x => `#status-${Correlative(x.name)}`).join(', ');
    $(ids).sortable({
      connectWith: '.taskList',
      placeholder: 'task-placeholder',
      forcePlaceholderSize: true,
      receive: async function ({ target }, { item }) {
        const ul = target;
        const li = item.get(0);
        const items = $(ul).sortable('toArray');
        if (!items.includes(li.id)) return;
        const result = await leadsRest.leadStatus({ status: ul.getAttribute('data-id'), lead: li.id });
        if (!result) return;
        // await getLeads();
      },
      update: function (event, ui) {
        if (this === ui.item.parent()[0]) {
          return;
        }
      }
    }).disableSelection();

    noteTypes.forEach(type => {
      new Quill(`#editor-${type.id}`, {
        theme: "bubble",
        modules: {
          toolbar: [[{ font: [] }, { size: [] }], ["bold", "italic", "underline", "strike"], [{ color: [] }, { background: [] }], [{ script: "super" }, { script: "sub" }], [{ header: [!1, 1, 2, 3, 4, 5, 6] }, "blockquote", "code-block"], [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }], ["direction", { align: [] }], ["link", "image", "video"], ["clean"]],
          mention: {
            allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
            mentionDenotationChars: ["@", "#"],
            source: async function (searchTerm, renderList, ...others) {
              const { data } = await usetsRest.paginate({ filter: ['fullname', 'contains', searchTerm] });
              renderList(data.map(({ relative_id, fullname }) => ({
                id: relative_id,
                value: fullname
              })));
            }
          }
        }
      })
      $(`#editor-${type.id}`).find('.ql-editor').empty()
    })

    setLeads([])
    if (defaultView == 'kanban') {
      getLeads();
    }
  }, [defaultView]);

  useEffect(() => {
    getNotes()
    getClientProducts()
    $(statusRef.current).val(leadLoaded?.status?.id).trigger('change')
    $(manageStatusRef.current).val(leadLoaded?.manage_status?.id).trigger('change')
  }, [leadLoaded]);

  const getLeads = async () => {
    const newLeads = await leadsRest.all()
    setLeads(newLeads)
  }

  const getNotes = async () => {
    const newNotes = await clientNotesRest.byClient(leadLoaded?.id);
    setNotes(newNotes ?? [])
  }

  const getClientProducts = async () => {
    const newClientProducts = await productsByClients.byClient(leadLoaded?.id)
    setClientProducts(newClientProducts)
  }

  const onLeadClicked = async (lead) => {
    setLeadLoaded(lead)
    history.pushState(null, null, `/leads/${lead.id}`)
    setNotes([])
    $(modalRef.current).modal('show')
  }

  const onSaveNote = async (e) => {
    const type = e.target.value
    const quill = typeRefs[type].current
    const editor = $(quill).find('.ql-editor')
    const text = editor.text().trim()
    const content = editor.html()
    if (!text.trim()) return Swal.fire({
      title: 'Ooops!',
      text: 'Ingresa un valor valido',
      timer: 2000
    })
    let title = ''
    let isTask = false
    switch (type) {
      case 'ed37659f-f9dc-49c1-9d0e-6a2effe9bd54':
        title = `${session.service_user.fullname} → ${leadLoaded.contact_name}`
        break
      case 'e20c7891-1ef8-4388-8150-4c1028cc4525':
        isTask = true
        title = `Nueva tarea`
        if (!taskEndsAtDateRef.current.value || !taskEndsAtTimeRef.current.value) return Swal.fire({
          title: 'Oops',
          text: 'Ingresa la fecha de finalizacion de la tarea',
          timer: 2000
        })
        break
      default:
        title = `Nota de ${session.service_user.fullname}`
        break
    }

    const mentions = [...new Set([...$(editor).find('.mention')].map(e => e.getAttribute('data-id')))]

    const result = await clientNotesRest.save({
      id: idRefs[type].current.value || undefined,
      note_type_id: type,
      process: processRef.current.value,
      status_id: $(statusRef.current).is(':visible') ? statusRef.current.value : undefined,
      manage_status_id: $(manageStatusRef.current).is(':visible') ? manageStatusRef.current.value : undefined,
      name: title,
      description: !isTask ? content : undefined,
      raw: !isTask ? text : undefined,
      client_id: leadLoaded.id,
      tasks: isTask ? [{
        name: taskTitleRef.current.value,
        type: taskTypeRef.current.value,
        priority: taskPriorityRef.current.value,
        description: text ? content : undefined,
        ends_at: `${taskEndsAtDateRef.current.value} ${taskEndsAtTimeRef.current.value}`,
        assigned_to: taskAssignedToRef.current.value,
        mentions
      }] : [],
      mentions: !isTask ? mentions : []
    })
    if (!result) return

    editor.empty()
    idRefs[type].current.value = null
    taskTitleRef.current.value = ''
    processRef.current.value = ''
    $(taskTypeRef.current).val('Por hacer').trigger('change')
    $(taskPriorityRef.current).val('Media').trigger('change')
    $(taskAssignedToRef.current).val('').trigger('change')
    taskEndsAtDateRef.current.value = ''
    taskEndsAtTimeRef.current.value = ''

    const newNotes = structuredClone(notes)
    const index = newNotes.findIndex(x => x.id == result.id)
    if (index == -1) newNotes.push(result)
    else newNotes[index] = result
    setNotes(newNotes)

    leadsRest.get(leadLoaded.id).then(data => {
      if (!data) return
      setLeadLoaded(data)
    })

    if (defaultView == 'kanban') getLeads()
    else $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteNote = async (noteId) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro?",
      text: `No podras revertir esta accion!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return
    await clientNotesRest.delete(noteId)
    const newNotes = structuredClone(notes).filter(({ id }) => id != noteId)
    setNotes(newNotes)
  }

  const onUpdateNoteClicked = async (note) => {
    const quill = typeRefs[note.type.id].current

    modalRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    quill.classList.add('highlight');
    setTimeout(() => {
      quill.classList.remove('highlight');
    }, 2000);

    idRefs[note.type.id].current.value = note.id || null
    $(quill).find('.ql-editor').html(note.description)

    if (note.type.id == 'e20c7891-1ef8-4388-8150-4c1028cc4525') {
      const task = note.tasks[0] ?? {}
      taskTitleRef.current.value = task?.name
      $(taskTypeRef.current).val(task?.type).trigger('change')
      $(taskPriorityRef.current).val(task?.priority).trigger('change')
      SetSelectValue(taskAssignedToRef.current, task?.assigned?.id, task?.assigned?.fullname)
      $(quill).find('.ql-editor').html(task?.description)
      taskEndsAtDateRef.current.value = moment(task?.ends_at).format('YYYY-MM-DD')
      taskEndsAtTimeRef.current.value = moment(task?.ends_at).format('HH:mm')
    }
  }

  const onDefaultViewClicked = (view) => {
    Local.set('default-view', view)
    setDefaultView(view)
  }

  const onClientStatusClicked = async (lead, status) => {
    await leadsRest.leadStatus({ lead, status })

    if (leadLoaded) {
      const newLeadLoaded = structuredClone(leadLoaded)
      newLeadLoaded.status = statuses.find(x => x.id == status);
      setLeadLoaded(newLeadLoaded)
      history.pushState(null, null, `/leads/${newLeadLoaded.id}`)
    }

    if (defaultView == 'kanban') getLeads()
    else $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onAttendClient = async (lead, attend) => {
    await leadsRest.attend(lead, attend)
    if (defaultView == 'kanban') getLeads()
    else $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onTaskStatusChange = async (id, status) => {
    const result = await taskRest.status({ id, status })
    if (!result) return
    if (result?.data?.refresh) {
      if (defaultView == 'kanban') getLeads()
      else $(gridRef.current).dxDataGrid('instance').refresh()
    }
    getNotes()
  }

  const onManageStatusChange = async (lead, status) => {
    await leadsRest.manageStatus({ lead: lead.id, status: status.id })
    const newLeadLoaded = structuredClone(lead)
    newLeadLoaded.manage_status = status;
    setLeadLoaded(newLeadLoaded)
    history.pushState(null, null, `/leads/${newLeadLoaded.id}`)
    if (defaultView == 'kanban') getLeads()
    else $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onArchiveClicked = async (data, e = null) => {
    const from = e ? e.target : $(`[id="${data.id}"]`).get(0);
    const to = document.getElementById('archived-item')
    Prepare2Send(from, to)
    const { isConfirmed } = await Swal.fire({
      title: "Este lead sera archivado",
      text: `Podras verlo en el menu de archivados`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return
    const deleted = await clientsRest.delete(data.id)
    if (!deleted) return
    if (defaultView == 'kanban') {
      $(`[id="${data.id}"]`).remove()
    } else $(gridRef.current).dxDataGrid('instance').refresh()

    Send2Div(to)
  }

  const onDeleteClicked = async (data) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro de eliminar este lead?",
      text: `No podras revertir esta accion!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return
    await leadsRest.delete(data.id)
    if (defaultView == 'kanban') {
      $(`[id="${data.id}"]`).remove()
    } else $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value,
      contact_name: contactNameRef.current.value || 'Lead anonimo',
      contact_email: contactEmailRef.current.value,
      contact_phone: contactPhoneRef.current.value.keep('0-9'),
      name: nameRef.current.value || 'Lead anonimo',
      web_url: webUrlRef.current.value,
      message: messageRef.current.value || 'Sin mensaje',
      client_width: window.screen.width,
      client_height: window.screen.height,
      client_system: navigator.platform ?? 'Linux'
    }

    if (!request.id) {
      const isConfirmed = await onPhoneChange(true)
      if (!isConfirmed) return
    }

    const result = await leadsRest.save(request)
    if (!result) return

    if (leadLoaded) setLeadLoaded(result)

    $(newLeadModalRef.current).modal('hide')
    if (defaultView == 'kanban') getLeads()
    else $(gridRef.current).dxDataGrid('instance').refresh()

  }

  const onOpenModal = (data = {}) => {
    idRef.current.value = data?.id ?? ''
    contactNameRef.current.value = data?.contact_name ?? ''
    contactEmailRef.current.value = data?.contact_email ?? ''
    contactPhoneRef.current.value = data?.contact_phone ?? ''
    nameRef.current.value = data?.name ?? ''
    webUrlRef.current.value = data?.web_url ?? ''
    messageRef.current.value = data?.message ?? ''

    $(newLeadModalRef.current).modal('show')
  }

  const onPhoneChange = async (saving = false) => {
    const phone = contactPhoneRef.current.value.keep('0-9')

    contactPhoneRef.current.disabled = true
    const result = await leadsRest.paginate({
      filter: ['contact_phone', '=', phone],
      requireTotalCount: true,
      take: 1,
      sort: [{
        selector: "created_at",
        desc: true
      }]
    })
    contactPhoneRef.current.disabled = false

    if (result?.totalCount > 0) {
      const lead = result.data[0]
      const { isConfirmed } = await Swal.fire({
        title: 'Lead registrado!',
        text: lead.creator ? `${lead.creator.fullname} ha registrado este lead anteriormente con el nombre de ${lead.contact_name}` : `Este numero de telefono ha sido registrado anteriormente con el nombre de ${lead.contact_name}`,
        icon: 'warning',
        confirmButtonText: saving ? 'Continuar de todos modos' : 'Ok',
        cancelButtonText: 'Cancelar',
        showCancelButton: saving,
      })
      return isConfirmed
    } return true
  }

  const onMakeLeadClient = async (data) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro?",
      text: `${data.contact_name} pasara a ser un cliente!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (isConfirmed) onClientStatusClicked(data.id, defaultClientStatus)
  }

  const addProduct2Client = async (product) => {
    const result = await productsByClients.save({
      client_id: leadLoaded.id,
      product_id: product.id,
      price: product.price
    })
    if (!result) return
    setClientProducts(old => ([...old, { ...product, pivot_id: result.pivot_id, pivot_price: result.price }]))
  }

  const deleteClientProduct = async (product) => {
    const result = await productsByClients.delete(product.pivot_id)
    if (!result) return
    setClientProducts(old => (old.filter(x => x.id != product.id)))
  }

  const onPriceChange = async (product) => {
    const result = await productsByClients.save({
      id: product.pivot_id,
      price: product.price
    })
    if (!result) return
  }

  const tasks = []
  notes?.forEach(note => tasks.push(...note.tasks))

  const pendingTasks = []
  notes?.forEach(note => pendingTasks.push(...note.tasks.filter(x => x.status != 'Realizado')))

  return (<>
    <div className='d-flex mb-2 gap-1'>
      <input id='view-as-table' type="radio" name='view-as' defaultChecked={defaultView == 'table'} onClick={() => onDefaultViewClicked('table')} />
      <label htmlFor="view-as-table">Tabla</label>
      <input id='view-as-kanban' type="radio" name='view-as' defaultChecked={defaultView == 'kanban'} onClick={() => onDefaultViewClicked('kanban')} />
      <label htmlFor="view-as-kanban">Pipelines</label>
    </div>
    {
      defaultView == 'table' ?
        <Table gridRef={gridRef} title='Leads' rest={leadsRest} reloadWith={[statuses, manageStatuses]}
          toolBar={(container) => {
            container.unshift(DxPanelButton({
              className: 'btn btn-xs btn-soft-dark text-nowrap',
              text: 'Actualizar',
              title: 'Refrescar tabla',
              icon: 'fas fa-undo-alt',
              onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
            }))
            can('leads', 'all', 'create') && container.unshift(DxPanelButton({
              className: 'btn btn-xs btn-soft-primary text-nowrap',
              text: 'Nuevo',
              title: 'Agregar registro',
              icon: 'fa fa-plus',
              onClick: () => onOpenModal()
            }))
          }}
          pageSize={50}
          allowedPageSizes={[50, 100]}
          // selection={{
          //   mode: 'multiple',
          //   selectAllMode: 'page'
          // }}
          columns={[
            {
              dataField: 'contact_name',
              caption: 'Lead',
              width: 250,
              cellTemplate: (container, { data }) => {
                container.attr('style', 'height: 48px; cursor: pointer')
                container.on('click', () => onLeadClicked(data))
                container.html(renderToString(<>
                  {
                    data.status_id == defaultLeadStatus
                      ? <b className='d-block'>{data.contact_name}</b>
                      : <span className='d-block'>{data.contact_name}</span>
                  }
                  {
                    data.products_count > 0 &&
                    <small className='text-muted'>{data.products_count} {data.products_count > 1 ? 'productos' : 'producto'}</small>
                  }
                </>))
              },
              fixed: true,
              fixedPosition: 'left'
            },
            {
              dataField: 'assigned.fullname',
              caption: 'Usuario',
              width: 58,
              cellTemplate: (container, { data }) => {
                container.attr('style', 'height: 48px')
                ReactAppend(container, <div className='d-flex align-items-center gap-1'>
                  {data.assigned_to
                    ? <>
                      <Tippy content={`Atendido por ${data.assigned.name} ${data.assigned.lastname}`}>
                        <img className='avatar-sm rounded-circle' src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${data.assigned.relative_id}`} alt={data.assigned.name} />
                      </Tippy>
                    </>
                    : ''}
                </div>)
              },
              fixed: true,
              fixedPosition: 'left'
            },
            {
              dataField: 'contact_email',
              caption: 'Correo'
            },
            {
              dataField: 'contact_phone',
              caption: 'Telefono'
            },
            {
              dataField: 'status.name',
              caption: 'Estado de gestión',
              dataType: 'string',
              width: 180,
              cellTemplate: (container, { data }) => {
                container.addClass('p-0')
                container.attr('style', 'overflow: visible')
                ReactAppend(container, <StatusDropdown
                  items={statuses}
                  defaultValue={data.status}
                  base={{
                    table_id: 'e05a43e5-b3a6-46ce-8d1f-381a73498f33'
                  }}
                  onItemClick={(status) => onClientStatusClicked(data.id, status.id)}
                  canCreate={can('statuses', 'all', 'create')}
                  canUpdate={can('statuses', 'all', 'update')}
                  canDelete={can('statuses', 'all', 'delete')}
                  onDropdownClose={(hasChanges, items) => {
                    if (!hasChanges) return
                    setStatuses(items)
                  }}
                />)
              }
            },
            {
              dataField: 'manage_status.name',
              caption: 'Estado del lead',
              dataType: 'string',
              width: 180,
              cellTemplate: (container, { data }) => {
                container.addClass('p-0')
                container.attr('style', 'overflow: visible')
                ReactAppend(container, <StatusDropdown
                  items={manageStatuses}
                  defaultValue={data.manage_status}
                  base={{
                    table_id: '9c27e649-574a-47eb-82af-851c5d425434'
                  }}
                  onItemClick={(status) => onManageStatusChange(data, status)}
                  canCreate={can('statuses', 'all', 'create')}
                  canUpdate={can('statuses', 'all', 'update')}
                  canDelete={can('statuses', 'all', 'delete')}
                  onDropdownClose={(hasChanges, items) => {
                    if (!hasChanges) return
                    setManageStatuses(items)
                  }}
                />)
              }
            },
            {
              dataField: 'origin',
              caption: 'Origen',
              dataType: 'string'
            },
            {
              dataField: 'triggered_by',
              caption: 'Disparado por',
              dataType: 'string'
            },
            {
              dataField: 'created_at',
              caption: 'Fecha creacion',
              dataType: 'date',
              cellTemplate: (container, { data }) => {
                container.text(moment(data.created_at).format('lll'))
              },
              sortOrder: 'desc',
            },
            {
              caption: 'Acciones',
              width: 240,
              cellTemplate: (container, { data }) => {
                container.attr('style', 'display: flex; gap: 4px; height: 47px; overflow: visible')

                ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-warning' title='Editar lead' onClick={() => onOpenModal(data)}>
                  <i className='fa fa-pen'></i>
                </TippyButton>)

                ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Ver detalles' onClick={() => onLeadClicked(data)}>
                  <i className='fa fa-eye'></i>
                </TippyButton>)

                if (!data.assigned_to) {
                  ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title="Atender lead"
                    onClick={() => onAttendClient(data.id, true)}>
                    <i className='fas fa-hands-helping'></i>
                  </TippyButton>)
                } else if (data.assigned_to == session.service_user.id) {
                  ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title="Dejar de atender"
                    onClick={() => onAttendClient(data.id, false)}>
                    <i className='fas fa-hands-wash'></i>
                  </TippyButton>)
                }

                ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-success' title='Convertir en cliente' onClick={async () => onMakeLeadClient(data)}>
                  <i className='fa fa-user-plus'></i>
                </TippyButton>)
                ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title='Archivar lead' onClick={(e) => onArchiveClicked(data, e)}>
                  <i className='mdi mdi-archive'></i>
                </TippyButton>)
                ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar lead' onClick={() => onDeleteClicked(data)}>
                  <i className='fa fa-trash'></i>
                </TippyButton>)
              },
              allowFiltering: false,
              allowExporting: false
            }
          ]} />
        : (<div className="d-flex gap-1 mb-3" style={{ overflowX: 'auto', minHeight: 'calc(100vh - 135px)' }}>
          {
            statuses.sort((a, b) => a.order - b.order).map((status, i) => {
              const correlative = Correlative(status.name)
              return (<div key={`status-${i}`} style={{ minWidth: '270px', maxWidth: '270px' }}>
                <div className="card mb-0">
                  <div className="card-header">
                    <h4 className="header-title my-0" style={{ color: status.color }}>{status.name}</h4>
                  </div>
                  <div className="card-body taskboard-box p-2" style={{ minHeight: '200px', maxHeight: 'calc(100vh - 190px)', overflow: 'auto' }}>
                    <ul className="sortable-list list-unstyled taskList" id={`status-${correlative}`} data-id={status.id}>
                      {
                        leads.filter(x => x.status_id == status.id).sort((a, b) => {
                          return a.created_at > b.created_at ? -1 : 1
                        }).sort((a, b) => {
                          return a.assigned_to == session.service_user.id ? -1 : 1
                        }).map((lead, i) => {
                          return <li id={`${lead.id}`} key={`lead-${i}`} style={{ cursor: 'move' }} className={`p-2 ${lead.assigned_to == session.service_user.id ? 'border border-primary' : ''}`}>
                            <div className="kanban-box" >
                              <div className="kanban-detail ms-0">
                                <div className="dropdown float-end">
                                  <a href="#" className="dropdown-toggle arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="mdi mdi-dots-vertical"></i>
                                  </a>
                                  <div className="dropdown-menu dropdown-menu-end">
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onLeadClicked(lead)}>
                                      <i className='fa fa-eye me-1'></i>
                                      Ver detalles
                                    </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onOpenModal(lead)}>
                                      <i className='fa fa-pen me-1'></i>
                                      Editar lead
                                    </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onMakeLeadClient(lead)}>
                                      <i className='fa fa-user-plus me-1'></i>
                                      Convertir en cliente
                                    </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onArchiveClicked(lead)}>
                                      <i className='mdi mdi-archive me-1'></i>
                                      Archivar lead
                                    </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onDeleteClicked(lead)}>
                                      <i className='fa fa-trash me-1'></i>
                                      Eliminar lead
                                    </a>
                                  </div>
                                </div>
                                {/* <span className="badge float-end" style={{
                                  backgroundColor: lead?.manage_status?.color || '#6c757d'
                                }}>{lead?.manage_status?.name ?? 'Sin estado'}</span> */}
                                <h5 className="mt-0 text-truncate">
                                  <Tippy content='Ver detalles'>
                                    <a href="#" onClick={() => onLeadClicked(lead)}
                                      className="text-dark">
                                      {lead.contact_name}
                                    </a>
                                  </Tippy>
                                </h5>
                                <ul className="list-inline d-flex align-items-center gap-1 mb-0">
                                  <li className="list-inline-item">
                                    {
                                      !lead.assigned_to
                                        ? <TippyButton className='btn btn-xs btn-soft-dark rounded-pill' title="Atender lead"
                                          onClick={() => onAttendClient(lead.id, true)}>
                                          <i className='fas fa-hands-helping'></i>
                                        </TippyButton>
                                        : (
                                          lead.assigned_to == session.service_user.id
                                            ? <TippyButton className='btn btn-xs btn-soft-danger' title="Dejar de atender"
                                              onClick={() => onAttendClient(lead.id, false)}>
                                              <i className='fas fa-hands-wash'></i>
                                            </TippyButton>
                                            : <Tippy content={`Atendido por ${lead?.assigned?.fullname}`}>
                                              <a href="" data-bs-toggle="tooltip" data-bs-placement="top"
                                                title="Username">
                                                <img src={`//${Global.APP_DOMAIN}/api/profile/${lead?.assigned?.relative_id}`} alt="img"
                                                  className="avatar-xs rounded-circle" />
                                              </a>
                                            </Tippy>
                                        )
                                    }
                                  </li>
                                  <li className="list-inline-item">
                                    <span className="badge d-block" style={{
                                      backgroundColor: lead?.manage_status?.color || '#6c757d',
                                      width: 'max-content'
                                    }}>{lead?.manage_status?.name ?? 'Sin estado'}</span>
                                    <small className='text-muted'>{moment(lead.created_at).format('LLL')}</small>
                                  </li>
                                  {/* <li className="list-inline-item">
                                    <Tippy content={`${lead.pending_tasks_count} tareas pendientes`}>
                                      <span style={{ position: 'relative' }}>
                                        <i className="mdi mdi-format-align-left"></i>
                                        {
                                          lead.notes_count > 0 &&
                                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem' }}>
                                            {lead.pending_tasks_count}<span className="visually-hidden">
                                              Tareas pendientes
                                            </span>
                                          </span>
                                        }
                                      </span>
                                    </Tippy>
                                  </li>
                                  <li className="list-inline-item">
                                    <Tippy content={`${lead.notes_count} registros de actividad`}>
                                      <span style={{ position: 'relative' }}>
                                        <i className="mdi mdi-comment-outline"></i>
                                        {
                                          lead.notes_count > 0 &&
                                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem' }}>
                                            {lead.notes_count}<span className="visually-hidden">
                                              Notas de {lead.contact_name}
                                            </span>
                                          </span>
                                        }
                                      </span>
                                    </Tippy>
                                  </li>
                                  <li className="list-inline-item">
                                    <Tippy content={`Eliminar lead`}>
                                      <b style={{ cursor: 'pointer' }} onClick={() => onDeleteClicked(lead)}>
                                        <i className="fa fa-trash text-danger"></i>
                                      </b>
                                    </Tippy>
                                  </li> */}
                                </ul>
                                {/* <div>
                                  <small className='text-muted'>{moment(lead.created_at).format('LLL')}</small>
                                </div> */}
                              </div>
                            </div>
                          </li>
                        })
                      }
                    </ul>
                  </div>
                </div>

              </div>)
            })
          }

        </div>)
    }
    <Modal modalRef={modalRef} title='Detalles del lead' btnSubmitText='Guardar' size='full-width' bodyClass='p-3 bg-light' isStatic onSubmit={(e) => e.preventDefault()}>
      <div className="row">
        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
          <div className="d-flex mb-3">
            {/* <img className="flex-shrink-0 me-3 rounded-circle avatar-md" alt={leadLoaded?.contact_name}
              src={`//${Global.APP_DOMAIN}/api/profile/null`} /> */}
            <div className="flex-grow-1">
              <h4 className="media-heading mt-0">
                <Tippy content="Modificar datos">
                  <i className='mdi mdi-lead-pencil me-1' style={{ cursor: 'pointer' }} onClick={() => onOpenModal(leadLoaded)}></i>
                </Tippy>
                {leadLoaded?.contact_name}
              </h4>
              <span className="badge bg-primary me-1">{leadLoaded?.contact_position || 'Trabajador'}</span> <small className='text-muted'>desde <b>{leadLoaded?.origin}</b></small>
            </div>
          </div>
          <hr />
          <h4>Estados</h4>
          <div className='d-flex flex-wrap gap-2 justify-content-between mb-2'>
            <div>
              <b className='d-block'>Estado de gestión</b>
              <div className='btn-group mb-0' style={{ width: '100%' }}>
                <button className="btn btn-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{ color: '#ffffff', backgroundColor: leadLoaded?.status?.color || '#6c757d' }}>
                  {leadLoaded?.status?.name || 'Sin estado'} <i className="mdi mdi-chevron-down"></i>
                </button>
                <div className="dropdown-menu">
                  {statuses.map((status, i) => {
                    return <span key={`status-${i}`} className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onClientStatusClicked(leadLoaded.id, status.id)}>{status.name}</span>
                  })}
                </div>
              </div>
            </div>
            <div>
              <b className='d-block'>Estado del lead</b>
              <div className="btn-group mb-0" style={{ width: '100%' }}>
                <button className="btn btn-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{ color: '#ffffff', backgroundColor: leadLoaded?.manage_status?.color || '#6c757d' }}>
                  {leadLoaded?.manage_status?.name || 'Sin estado'} <i className="mdi mdi-chevron-down"></i>
                </button>
                <div className="dropdown-menu">
                  {manageStatuses.map((status, i) => {
                    return <span key={`status-${i}`} className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onManageStatusChange(leadLoaded, status)}>{status.name}</span>
                  })}
                </div>
              </div>
            </div>
          </div>
          {
            leadLoaded?.assigned_to && <>
              <b className='d-block mb-1'>Atendido por:</b>
              <div className="d-flex align-items-start">
                <img className="d-flex me-2 rounded-circle" src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${leadLoaded?.assigned?.relative_id}`}
                  alt={leadLoaded?.assigned?.name} height="32" />
                <div className="w-100">
                  <h5 className='m-0 font-14'>{leadLoaded?.assigned?.name}</h5>
                  <span className="font-12 mb-0">{leadLoaded?.assigned?.email}</span>
                </div>
              </div>
            </>
          }
          <hr />
          <h4>Datos del contacto</h4>
          <h5 className="font-600 mb-0">Correo electronico</h5>
          <p className='mb-2 text-truncate'> {leadLoaded?.contact_email} </p>
          <h5 className="font-600 mb-0">Tefono / Celular</h5>
          <p className='mb-2'> {leadLoaded?.contact_phone} </p>
          <h5 className="font-600 mb-0">Mensaje</h5>
          <p className='mb-2'> {leadLoaded?.message} </p>
          <h5 className="font-600 mb-0">Fecha de registro</h5>
          <p className='mb-2'>
            {moment(leadLoaded?.created_at).format('LL')}<br />
            <small className="text-muted">{moment(leadLoaded?.created_at).format('LTS')}</small>
          </p>
          <hr />
          <h4>Datos de la empresa</h4>

          <h5 className="font-600 mb-0">Nombre comercial</h5>
          <p className='mb-2'> {leadLoaded?.tradename ?? <i className='text-muted'>No especifica</i>} </p>

          <h5 className="font-600 mb-0">RUC</h5>
          <p className='mb-2'> {leadLoaded?.ruc ?? <i className='text-muted'>No especifica</i>} </p>

          <h5 className="font-600 mb-0">N° trabajadores</h5>
          <p className='mb-2'> {leadLoaded?.workers ?? <i className='text-muted'>No especifica</i>} </p>

        </div>

        <div className="col-lg-6 col-md-4 col-sm-6 col-xs-12">
          <div className="card card-body">
            <ul className="nav nav-tabs" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
              <li key={`note-type-activity`} className="nav-item">
                <a href="#note-type-activity" data-bs-toggle="tab" aria-expanded="false" className="nav-link active text-center">
                  <i className="mdi mdi-clock"></i> Actividad
                </a>
              </li>
              {
                noteTypes.sort((a, b) => a.order - b.order).map((type, i) => {
                  if (!leadLoaded?.contact_email && type.name == 'Correos') return
                  return <li key={`note-type-${i}`} className="nav-item">
                    <a href={`#note-type-${type.id}`} data-name={type.name} data-bs-toggle="tab" aria-expanded="false" className="nav-link text-center">
                      <i className={type.icon}></i> {type.name}
                    </a>
                  </li>
                })
              }
            </ul>
            <div className="tab-content">
              <div key={`tab-note-type-activity`} className='tab-pane active' id={`note-type-activity`}>
                {
                  notes.sort((a, b) => b.created_at > a.created_at ? 1 : -1).map((note, i) => {
                    return <ClientNotesCard key={`note-${i}`} {...note} onTaskChange={onTaskStatusChange} showOptions={false} session={session} />
                  })
                }

              </div>
              {
                noteTypes.sort((a, b) => a.order - b.order).map((type, i) => {
                  const drawGoogleAuth = type.id == '37b1e8e2-04c4-4246-a8c9-838baa7f8187' && !hasGSToken
                  return <div key={`tab-note-type-${i}`} className='tab-pane' id={`note-type-${type.id}`}>
                    {
                      !drawGoogleAuth &&
                      <h4 className='header-title mb-2 d-flex justify-content-between align-items-center'>
                        <span>Lista de {type.name}</span>
                        {
                          type.id == '37b1e8e2-04c4-4246-a8c9-838baa7f8187' &&
                          <div className='d-flex gap-1'>
                            <Tippy content='Refrescar correos'>
                              <button className='btn btn-xs btn-white' type='button' disabled={loadingMails} onClick={() => setLeadLoaded(old => ({ ...old, refresh: crypto.randomUUID() }))}>
                                {
                                  loadingMails
                                    ? <i className='fa fa-spinner fa-spin'></i>
                                    : <i className='fas fa-redo'></i>
                                }
                              </button>
                            </Tippy>
                            <button className='btn btn-xs btn-success' type='button' onClick={() => {
                              setInReplyTo(null)
                              $(composeModal.current).modal('show');
                            }}>
                              <i className='mdi mdi-pen me-1'></i>
                              Redactar
                            </button>
                          </div>
                        }
                      </h4>
                    }
                    <input ref={idRefs[type.id]} type="hidden" />
                    <div className="row">
                      {
                        drawGoogleAuth && <div className='col-12 text-center'>
                          <h1>¡Ups!</h1>
                          <p>
                            Necesitamos tu permiso para acceder a tu correo electrónico. <br />
                            <small className='text-muted'>No te preocupes, tus datos están seguros con nosotros.</small>
                          </p>
                          <div className='d-flex flex-column justify-content-center align-items-center gap-1'>
                            <button className='btn btn-sm btn-primary' type='button' onClick={() => setTokenUUID(crypto.randomUUID())}>
                              Ya he iniciado sesión
                            </button>
                            <button className="btn btn-sm btn-white d-inline-flex align-items-center gap-1" type='button' onClick={e => {
                              const authWindow = window.open(googleAuthURI, '_blank')
                              const lastTokenUUID = Local.get('tokenUUID')
                              const interval = setInterval(() => {
                                const newTokenUUID = Local.get('tokenUUID')
                                if (lastTokenUUID != newTokenUUID) {
                                  clearInterval(interval)
                                  authWindow.close();
                                  setTokenUUID()
                                }
                              }, [500]);
                            }}>
                              <img src={googleSVG} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain', objectPosition: 'center' }} />
                              <span>Permitir acceso</span>
                            </button>
                          </div>
                        </div>
                      }
                      {
                        type.id == 'e20c7891-1ef8-4388-8150-4c1028cc4525' &&
                        <>
                          <InputFormGroup eRef={taskTitleRef} label='Titulo de la tarea' col='col-12' required />
                          <SelectFormGroup eRef={taskTypeRef} label="Tipo de tarea" col="col-lg-4 col-md-12" required dropdownParent={`#note-type-${type.id}`} minimumResultsForSearch={Infinity} >
                            <option value="Llamada">Llamada</option>
                            <option value="Correo">Correo</option>
                            <option value="Por hacer" selected>Por hacer</option>
                          </SelectFormGroup>
                          <SelectFormGroup eRef={taskPriorityRef} label="Prioridad" col="col-lg-3 col-md-12" required dropdownParent={`#note-type-${type.id}`} minimumResultsForSearch={Infinity} >
                            <option value="Baja">Baja</option>
                            <option value="Media" selected>Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                          </SelectFormGroup>
                          <SelectAPIFormGroup eRef={taskAssignedToRef} label='Asignado a' col='col-lg-5 col-md-12' dropdownParent={`#note-type-${type.id}`} searchAPI='/api/users/paginate' searchBy='fullname' />
                          <InputFormGroup eRef={taskEndsAtDateRef} label='Fecha finalización' type='date' col='col-lg-6 col-md-12' required />
                          <InputFormGroup eRef={taskEndsAtTimeRef} label='Hora finalización' type='time' col='col-lg-6 col-md-12' required />
                        </>
                      }
                      {
                        (type.id == '8e895346-3d87-4a87-897a-4192b917c211') && <>
                          <InputFormGroup eRef={processRef} label='Proceso' col='col-12' parentClassName='dropdown' className='dropdown-toggle' data-bs-toggle='dropdown' >
                            <ul className="dropdown-menu" style={{ width: '100%' }}>
                              {
                                processes.map((process, index) => {
                                  return <li key={index} className='dropdown-item' onClick={() => processRef.current.value = process.name} style={{ cursor: 'pointer' }}>
                                    <b className='d-block'>{process.name}</b>
                                    {
                                      process.description &&
                                      <small className='d-block text-truncate'>{process.description}</small>
                                    }
                                  </li>
                                })
                              }
                            </ul>
                          </InputFormGroup>
                        </>
                      }
                      <div className="col-12 mb-2" hidden={type.id == '37b1e8e2-04c4-4246-a8c9-838baa7f8187'}>
                        <label className='mb-1' htmlFor="">Contenido</label>
                        <div ref={typeRefs[type.id]} id={`editor-${type.id}`} style={{ height: '162px', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}></div>
                      </div>
                      {
                        (type.id == '8e895346-3d87-4a87-897a-4192b917c211') && <>
                          <SelectFormGroup eRef={statusRef} label='Estado de gestión' col='col-sm-12 col-md-12 col-lg-6' dropdownParent={`#note-type-${type.id}`} minimumResultsForSearch={-1}>
                            {statuses.map((status, index) => {
                              return <option key={index} value={status.id}>{status.name}</option>
                            })}
                          </SelectFormGroup>
                          <SelectFormGroup eRef={manageStatusRef} label='Estado del lead' col='col-lg-6 col-md-12' dropdownParent={`#note-type-${type.id}`} minimumResultsForSearch={-1}>
                            {manageStatuses.map((status, index) => {
                              return <option key={index} value={status.id}>{status.name}</option>
                            })}
                          </SelectFormGroup>
                        </>
                      }
                      {
                        type.id != '37b1e8e2-04c4-4246-a8c9-838baa7f8187' &&
                        <div className="col-12">
                          <button className='btn btn-sm btn-success' type='button' value={type.id} onClick={onSaveNote}>Guardar</button>
                        </div>
                      }
                    </div>
                    {
                      type.id != '37b1e8e2-04c4-4246-a8c9-838baa7f8187' && <hr />
                    }
                    {
                      type.id == '37b1e8e2-04c4-4246-a8c9-838baa7f8187'
                        ? mails?.map((mail, index) => {
                          const sender = String(mail.sender).replace(/\<(.*?)\>/g, '<span class="me-1">·</span><small style="font-weight: lighter">&lt;$1&gt;</small>')
                          const date = new Date(mail.date)
                          return <div key={index} className="card mb-2 border">
                            <div className="card-header p-2" style={{ cursor: 'pointer' }} onClick={async () => {
                              const mailing = await gmailRest.getDetails(mail.id)
                              if (!mailing) return
                              setMailLoaded(mailing)
                              $(mailModal.current).modal('show')
                            }}>
                              <b className='d-block'>
                                {
                                  mail.type == 'sent'
                                    ? <i className='mdi mdi-send me-1'></i>
                                    : <i className="mdi mdi-inbox me-1"></i>
                                }
                                <HtmlContent className={'d-inline'} html={sender} />
                              </b>
                              <small className='text-muted'>{moment(date).format('LLL')}</small>
                            </div>
                            <div className="card-body p-2">
                              <small>
                                <b>{mail.subject}</b> - {mail.snippet || '.'}
                              </small>
                            </div>
                          </div>
                        })
                        : notes.filter(x => x.note_type_id == type.id).sort((a, b) => b.created_at > a.created_at ? 1 : -1).map((note, i) => {
                          return <ClientNotesCard key={`note-${i}`} {...note} session={session} onDeleteNote={onDeleteNote} onUpdateNote={onUpdateNoteClicked} />
                        })
                    }
                  </div>
                })
              }
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
          <div className="card">
            <div className="card-header bg-danger">
              <h5 className="header-title my-0 text-white">Tareas</h5>
            </div>
            <div className="card-body">
              {
                pendingTasks.length > 0
                  ? pendingTasks.sort((a, b) => a.ends_at > b.ends_at ? 1 : -1).map((task, i) => {
                    return <TaskCard key={`task-${i}`} {...task} onChange={onTaskStatusChange} />
                  })
                  : <i className='text-muted'>- No hay tareas pendientes -</i>
              }
            </div>
          </div>
          <div className="card">
            <div className="card-header bg-primary">
              <div className="float-end text-white">
                S/. {Number2Currency(clientProducts.reduce((total, product) => total + Number(product.price), 0))}
              </div>
              <h5 className="header-title my-0 text-white">Productos</h5>
            </div>
            <div className="card-body">
              <Dropdown className='d-block mx-auto btn btn-sm btn-white rounded-pill' title='Agregar' icon={{ icon: 'fa fa-plus' }} tippy='Agregar producto al cliente'>
                {
                  products.map((product, index) => {
                    if (clientProducts.find(x => x.id == product.id)) {
                      return <DropdownItem key={index} className='py-1' style={{ cursor: 'not-allowed', opacity: 0.5 }} tippy='Ya ha sido agregado'>
                        <b className='d-block text-truncate'>{product.name}</b>
                        <small>S/. {Number2Currency(product.price)}</small>
                      </DropdownItem>
                    } else {
                      return <DropdownItem key={index} className='py-1' onClick={() => addProduct2Client(product)}>
                        <b className='d-block text-truncate'>{product.name}</b>
                        <small>S/. {Number2Currency(product.price)}</small>
                      </DropdownItem>
                    }
                  })
                }
              </Dropdown>
              <div className='mt-2 d-flex flex-column gap-2'>
                {
                  clientProducts.map((product, index) => {
                    return <SimpleProductCard key={index} {...product} onDelete={deleteClientProduct} onChange={onPriceChange} />
                  })
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <Modal modalRef={newLeadModalRef} title='Nuevo lead' btnSubmitText='Guardar' onSubmit={onModalSubmit} zIndex={1060}>
      <div className="row mb-0">
        <input ref={idRef} type="hidden" />
        <InputFormGroup eRef={contactNameRef} label='Nombre completo' />
        <InputFormGroup eRef={contactEmailRef} label='Correo electronico' type="email" col='col-md-6' />
        <InputFormGroup eRef={contactPhoneRef} label='Telefono' type="tel" col='col-md-6' required onBlur={() => onPhoneChange()} />
        <InputFormGroup eRef={nameRef} label='Empresa / Marca' col='col-md-6' />
        <InputFormGroup eRef={webUrlRef} label='Link de WEB' col='col-md-6' />
        <TextareaFormGroup eRef={messageRef} label='Mensaje' placeholder='Ingresa tu mensaje' rows={4} />
      </div>
    </Modal>

    <Modal modalRef={mailModal} title={mailLoaded?.subject} size='lg' zIndex={1060} hideHeader hideFooter>
      <button type="button" className="btn-close float-end" data-bs-dismiss="modal" aria-label="Close"></button>
      <table style={{
        width: 'max-content',
        maxWidth: '100%',
      }}>
        <tbody>
          <tr>
            <th className='py-0 px-1' style={{ textAlign: 'end' }}>De:</th>
            <td className='py-0 px-1'>{mailLoaded?.sender}</td>
          </tr>
          <tr>
            <th className='py-0 px-1' style={{ textAlign: 'end' }}>Para:</th>
            <td className='py-0 px-1'>{mailLoaded?.to}</td>
          </tr>
          {
            mailLoaded?.cc &&
            <tr>
              <th className='py-0 px-1' style={{ textAlign: 'end' }}>Cc:</th>
              <td className='py-0 px-1'>{mailLoaded?.cc}</td>
            </tr>
          }
          {
            mailLoaded?.bcc &&
            <tr>
              <th className='py-0 px-1' style={{ textAlign: 'end' }}>Bcc:</th>
              <td className='py-0 px-1'>{mailLoaded?.bcc}</td>
            </tr>
          }
          <tr>
            <th className='py-0 px-1' style={{ textAlign: 'end' }}>Fecha:</th>
            <td className='py-0 px-1'>{moment(new Date(mailLoaded?.date)).format('LLL')}</td>
          </tr>
          <tr>
            <th className='py-0 px-1' style={{ textAlign: 'end' }}>Asunto:</th>
            <td className='py-0 px-1'>{mailLoaded?.subject}</td>
          </tr>
        </tbody>
      </table>
      <hr className="my-2" />
      <HtmlContent html={mailLoaded?.bodyHtml} style={{
        minHeight: '360px'
      }} />
      <hr className='mt-2 mb-0' />
      {
        mailLoaded?.attachments?.length > 0 && <div className='mt-2 d-flex flex-wrap gap-2'>
          {mailLoaded?.attachments?.map((file) => {
            return <div className='d-flex gap-1 border p-1' style={{
              width: '180px'
            }}>
              <i className='mdi mdi-file'></i>
              <div>
                <Tippy content={file.filename}>
                  <span className='d-block text-truncate' style={{ width: '145px' }}>{file.filename}</span>
                </Tippy>
                <div className='d-flex gap-1 align-items-center justify-content-between'>
                  <small className='d-block'>{FormatBytes(file.size)}</small>
                  <div className='d-flex gap-1'>
                    <Tippy content='Abrir'>
                      <a href={`/api/gmail/attachment/${mailLoaded?.id}/${file.attachmentId}/${file.filename}`} target='_blank' className="btn btn-xs btn-white" type='button'>
                        <i className='fa fa-eye'></i>
                      </a>
                    </Tippy>
                    <Tippy content='Descargar'>
                      <a href={`/api/gmail/attachment/${mailLoaded?.id}/${file.attachmentId}/${file.filename}`} target='_blank' download className="btn btn-xs btn-white" type='button'>
                        <i className='fa fa-download'></i>
                      </a>
                    </Tippy>
                  </div>
                </div>
              </div>
            </div>
          })}
        </div>
      }
      {
        mailLoaded?.sender?.includes(leadLoaded?.contact_email) &&
        <div className='mt-2'>
          <button className='btn btn-xs btn-white rounded-pill' type='button' onClick={() => {
            setInReplyTo(mailLoaded)
            $(composeModal.current).modal('show');
          }}>
            <i className='fas fa-reply me-1'></i>
            Responder
          </button>
        </div>
      }
    </Modal>

    <MailingModal modalRef={composeModal} data={leadLoaded} session={session} setSession={setSession} inReplyTo={inReplyTo} onSend={(newNote) => {
      setLeadLoaded(old => ({ ...old, refresh: crypto.randomUUID() }))
      setNotes(old => ([...old, newNote]))
    }} />
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Leads'>
      <Leads {...properties} />
    </Adminto>
  );
})