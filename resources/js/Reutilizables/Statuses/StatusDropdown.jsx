import React, { useRef, useState, useEffect, useCallback } from "react"
import Dropdown from "../../components/dropdown/DropDown"
import DropdownItem from "../../components/dropdown/DropdownItem"
import Tippy from "@tippyjs/react"
import StatusesRest from "../../actions/StatusesRest"
import Swal from "sweetalert2"
import { Local } from "sode-extend-react"

const statusesRest = new StatusesRest();

export default function StatusDropdown({
  defaultValue,
  items: propItems = [],
  base = {},
  canCreate = false,
  canUpdate = false,
  canDelete = false,
  onItemClick = () => { },
  onDropdownClose = () => { },
}) {
  const dropdownRef = useRef()
  const nameRef = useRef()
  const colorRef = useRef()
  const containerRef = useRef()

  const [items, setItems] = useState(propItems)
  const [shouldScroll, setShouldScroll] = useState(false)
  const [dropdownHasChanges, setDropdownHasChanges] = useState(false)
  
  const selected = items.find(x => x.id == defaultValue.id)

  const smoothScroll = useCallback((element, target, duration) => {
    const start = element.scrollTop
    const change = target - start
    const startTime = performance.now()

    const animateScroll = (currentTime) => {
      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / duration, 1)
      const easeInOutCubic = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      element.scrollTop = start + change * easeInOutCubic

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)

    Local.onchange('statuses', (e) => {
      console.log(e)
    })
  }, [])

  useEffect(() => {
    if (shouldScroll && containerRef.current) {
      const scrollTarget = containerRef.current.scrollHeight - containerRef.current.clientHeight
      smoothScroll(containerRef.current, scrollTarget, 300) // 300ms duration for the animation
      setShouldScroll(false)
    }
    Local.set('statuses', items)
  }, [items, shouldScroll, smoothScroll])

  useEffect(() => {
    const dropdownElement = $(dropdownRef.current);
    const handleDropdownHidden = () => {
      const cleanItems = structuredClone(items).filter(x => x.id).map(x => {
        x.editing = false
        return x
      })
      setItems(cleanItems)
      onDropdownClose(dropdownHasChanges, cleanItems)
    };
    dropdownElement.on('hidden.bs.dropdown', handleDropdownHidden);
    return () => {
      dropdownElement.off('hidden.bs.dropdown', handleDropdownHidden);
    };
  }, [dropdownHasChanges, items]);

  // useEffect(() => {
  //   const container = $(containerRef.current);

  //   container.sortable({
  //     placeholder: 'sortable-placeholder', // Clase para el placeholder
  //     forcePlaceholderSize: true, // Asegurar que el espacio placeholder tenga tamaño
  //     receive: async function (event, ui) {
  //       const ul = event.target;
  //       const li = ui.item.get(0);
  //       const items = $(ul).sortable('toArray');

  //       console.log({ items, li });

  //       // if (!items.includes(li.id)) return;
  //       // const result = await leadsRest.leadStatus({ status: ul.getAttribute('data-id'), lead: li.id });
  //       // if (!result) return;
  //       // await getLeads();
  //     },
  //     update: function (event, ui) {
  //       if (this === ui.item.parent()[0]) {
  //         return;
  //       }
  //     }
  //   }).disableSelection();
  //   return () => {
  //     container.sortable("destroy");
  //   };
  // }, [items]);

  const onAddStatusClicked = (e) => {
    e.stopPropagation()
    setItems(old => [...old.map(x => {
      x.editing = false
      return x
    }), { editing: true }])
    setShouldScroll(true)
  }

  const onUpdateStatusClicked = (e, item) => {
    e.stopPropagation()
    setItems(old => {
      return old.map(x => {
        if (!x.id) return
        x.editing = x.id === item.id
        return x
      }).filter(Boolean)
    })
  }

  const onDeleteStatusClicked = async (e, item) => {
    e.stopPropagation()
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro de eliminar este estado?",
      text: `No podras revertir esta accion!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return
    const result = await statusesRest.delete(item.id)
    console.log(result)
    if (!result) return
    const cleanItems = structuredClone(items).map(x => {
      if (!x.id) return
      if (x.id == item.id) return
      x.editing = x.id === item.id
      return x
    }).filter(Boolean)
    setItems(cleanItems)
    setDropdownHasChanges(true)
    onDropdownClose(true, cleanItems)
  }

  const onItemSave = async (e, item) => {
    e.preventDefault()
    const result = await statusesRest.save({
      ...structuredClone(base),
      id: item.id ?? undefined,
      name: nameRef.current.value,
      color: colorRef.current.value
    })

    if (!result) return

    if (items.find(x => x.id == result.id)) {
      setItems(old => {
        const index = old.findIndex(x => x.id == result.id)
        old[index] = result
        return structuredClone(old).filter(x => x.id)
      })
    } else {
      setItems(old => [...old.filter(x => x.id), result])
    }
    setDropdownHasChanges(item.name != result.name || item.color != result.color)
  }

  const onItemCancel = (item) => {
    setItems(old => old.filter(x => x.id || !x.editing).map(x => ({ ...x, editing: false })))
  }

  return (
    <Dropdown
      ddRef={dropdownRef}
      className='btn btn-white text-truncate'
      title={selected.name}
      tippy='Actualizar estado'
      style={{
        border: 'none',
        borderRadius: '0',
        width: '179px',
        height: '47px',
        color: '#fff',
        fontWeight: 'bolder',
        backgroundColor: selected.color
      }}
    >
      <div
        ref={containerRef}
        style={{
          maxHeight: '173px',
          overflowY: 'auto'
        }}
      >
        {items.sort((a, b) => a.order - b.order).map((item, index) => {
          const { name, color, editing } = item
          const uuid = `item-${crypto.randomUUID()}`
          return (
            <DropdownItem
              key={index}
              onClick={(e) => {
                if (editing) {
                  e.stopPropagation()
                } else {
                  setItems(old => [...old.map(x => {
                    if (!x.id) return
                    x.editing = false
                    return x
                  }).filter(Boolean)])
                  onItemClick(item)
                }
              }}
              className={editing ? 'p-0' : 'p-2 show-button-child'}
            >
              {editing ? (
                <form className="input-group" onSubmit={(e) => onItemSave(e, item)}>
                  <label htmlFor={uuid} className="input-group-text p-0 d-flex align-items-center" style={{ cursor: 'pointer' }}>
                    <input
                      ref={colorRef}
                      id={uuid}
                      className="mx-1"
                      type="color"
                      defaultValue={color}
                      style={{
                        padding: 0,
                        height: '25px',
                        width: '25px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                  </label>
                  <input ref={nameRef} className="form-control" type="text" defaultValue={name} />
                  <Tippy content="Guardar">
                    <button className="btn input-group-text btn-xs btn-success waves-effect waves-light" type="submit">
                      <i className="fa fa-check" aria-hidden="true"></i>
                      <span className="sr-only">Guardar</span>
                    </button>
                  </Tippy>
                  <Tippy content="Cancelar">
                    <button className="btn input-group-text btn-xs btn-danger waves-effect waves-light" type="button" onClick={() => onItemCancel(item)}>
                      <i className="fa fa-times" aria-hidden="true"></i>
                      <span className="sr-only">Cancelar</span>
                    </button>
                  </Tippy>
                </form>
              ) : (
                <>
                  <div className="position-absolute d-flex gap-1" style={{
                    top: '50%',
                    right: '8px',
                    transform: 'translateY(-50%)'
                  }}>
                    {
                      canUpdate &&
                      <Tippy content='Editar'>
                        <span style={{cursor: 'pointer'}} className="btn btn-xs btn-soft-primary " onClick={e => onUpdateStatusClicked(e, item)} type='button'>
                          <i className="fa fa-pen" aria-hidden="true"></i>
                          <span className="sr-only">Editar</span>
                        </span>
                      </Tippy>
                    }
                    {
                      canDelete &&
                      <Tippy content='Eliminar'>
                        <span style={{cursor: 'pointer'}} className="btn btn-xs btn-soft-danger" onClick={e => onDeleteStatusClicked(e, item)} type='button'>
                          <i className="fa fa-trash" aria-hidden="true"></i>
                          <span className="sr-only">Eliminar</span>
                        </span>
                      </Tippy>
                    }
                  </div>
                  <i className='fa fa-circle me-2' style={{ color }} aria-hidden="true"></i>
                  <span>{name}</span>
                </>
              )}
            </DropdownItem>
          )
        })}
      </div>
      {canCreate && (
        <DropdownItem onClick={onAddStatusClicked}>
          <i className='fa fa-plus me-2' aria-hidden="true"></i>
          <span>Agregar estado</span>
        </DropdownItem>
      )}
    </Dropdown>
  )
}