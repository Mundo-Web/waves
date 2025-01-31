import React from 'react'
import Logout from '../actions/Logout'
import MenuItem from './MenuItem'
import MenuItemContainer from './MenuItemContainer'
import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css';
import BusinessCard from '../Reutilizables/Business/BusinessCard'

const Menu = ({ session, can, presets, APP_PROTOCOL, APP_DOMAIN, leadsCount, tasksCount, businesses }) => {
  let mainRole = {}
  if (session.is_owner) {
    mainRole = {
      name: 'Owner',
      description: 'Persona que crea la empresa'
    }
  } else {
    mainRole = session.service_user.roles[0] ?? {
      name: 'Sin rol',
      description: 'El usuario aún no tiene un rol asignado'
    }
  }

  const currentBusiness = businesses.find(({ id }) => session.business_id == id)
  const otherBusinesses = businesses.filter(({ id }) => session.business_id != id)

  const idBirthday = moment(session.birthdate).format('MM-DD') == moment().format('MM-DD')

  return (<div className="left-side-menu">
    <div className="h-100" data-simplebar>
      <div className="user-box text-center">
        <img src={`//${APP_DOMAIN}/api/profile/thumbnail/${session.relative_id}?v=${new Date(session.updated_at).getTime()}`} alt={session.name} title={session.name}
          className="rounded-circle img-thumbnail avatar-md" style={{ backgroundColor: 'unset', borderColor: '#98a6ad', objectFit: 'cover', objectPosition: 'center' }} />
        <div className="dropdown">
          <a href="#" className="user-name dropdown-toggle h5 mt-2 mb-1 d-block" data-bs-toggle="dropdown"
            aria-expanded="false" style={{ fontFamily: "'Comfortaa', sans-serif" }}>
            {session.name.split(' ')[0]} {session.lastname.split(' ')[0]} {idBirthday ? <Tippy content={`Feliz cumpleaños ${session.name}`} arrow={true}><i className=' fas fa-birthday-cake text-danger'></i></Tippy> : ''}
          </a>
          <div className="dropdown-menu user-pro-dropdown">


            <a href={`//${APP_DOMAIN}/profile`} className="dropdown-item notify-item">
              <i className="fe-user me-1"></i>
              <span>Mi perfil</span>
            </a>

            <a href={`//${APP_DOMAIN}/account`} className="dropdown-item notify-item">
              <i className="mdi mdi-account-key-outline me-1"></i>
              <span>Mi cuenta</span>
            </a>

            <a href="#" className="dropdown-item notify-item right-bar-toggle dropdown notification-list">
              <i className="fe-settings me-1"></i>
              <span>Configuracion</span>
            </a>

            <a href="#" className="dropdown-item notify-item" onClick={Logout}>
              <i className="fe-log-out me-1"></i>
              <span>Cerrar sesion</span>
            </a>

          </div>
        </div>

        <Tippy content={mainRole.description} arrow={true}>
          <p className="text-muted left-user-info" >{mainRole.name}</p>
        </Tippy>
      </div>

      <div className='px-2 py-1 text-center' style={{ position: 'relative' }}>
        <a className="btn dropdown-toggle waves-effect waves-light d-flex align-items-center justify-content-between gap-1 mx-auto" data-bs-toggle="dropdown"
          href="#" role="button" aria-haspopup="false" aria-expanded="false" style={{ borderColor: 'rgba(187, 187, 187, .25)', width: 'max-content', boxShadow: '0 0 8px rgba(187, 187, 187, .125)', borderRadius: '8px' }}>
          <div className="d-flex align-items-start">
            <img className="d-flex me-2 rounded-circle" src={`//${APP_DOMAIN}/api/logo/thumbnail/null`}
              alt={currentBusiness.name} height="32" />
            <div className="w-100">
              <h5 className={`m-0 font-14 text-primary text-truncate`} style={{ width: '115px' }}>{currentBusiness.name}</h5>
              <span className="font-12 mb-0">RUC: {currentBusiness.person.document_number}</span>
            </div>
          </div>
          <i className="mdi mdi-chevron-down"></i>
        </a>
        <div className="dropdown-menu dropdown-menu-center profile-dropdown w-full">
          {
            otherBusinesses.length > 0 &&
            <>
              <div className="notification-list">
                {
                  otherBusinesses.sort((a, b) => {
                    return a.id == session.business_id ? -1 : 1
                  }).map((business, i) => {
                    return <BusinessCard key={`business-${i}`} {...business} session={session} APP_PROTOCOL={APP_PROTOCOL} APP_DOMAIN={APP_DOMAIN} />
                  })
                }
              </div>
              <div className="dropdown-divider"></div>
            </>
          }
          <a href={`//${APP_DOMAIN}/businesses`} className="dropdown-item notify-item">
            <i className="fe-arrow-up-right"></i>
            <span>Otras empresas</span>
          </a>
        </div>

      </div>


      <div id="sidebar-menu" className='show'>

        <ul id="side-menu">
          <li className="menu-title">Panel de navegacion</li>

          <MenuItem href="/home" icon='mdi mdi-home'>Inicio</MenuItem>
          <MenuItem href="/sessions" icon='mdi mdi-vector-triangle'>Cuentas</MenuItem>
          <MenuItem href="/templates" icon='mdi mdi-page-layout-header-footer'>Plantillas</MenuItem>

          {
            (can('users', 'root', 'all', 'list') || can('roles', 'root', 'all', 'list') || can('permissions', 'root', 'all', 'list')) &&
            <MenuItemContainer title='Usuarios y roles' icon='mdi mdi-account-lock'>
              {
                can('users', 'root', 'all', 'list') &&
                <MenuItem href="/users" icon='mdi mdi-account'>Usuarios</MenuItem>
              }
              {
                can('roles', 'root', 'all', 'list') &&
                <MenuItem href="/roles" icon='mdi mdi-account-convert'>Roles</MenuItem>
              }
              {/* {
                can('permissions', 'root', 'all', 'list') &&
                <MenuItem href="/permissions" icon='mdi mdi-account-check'>Permisos</MenuItem>
              } */}
            </MenuItemContainer>
          }

          {
            can('apikeys', 'all', 'list') &&
            <MenuItem href="/apikeys" icon='mdi mdi-api'>API Keys</MenuItem>
          }

          {
            (can('tables', 'root', 'all', 'list') || can('statuses', 'root', 'all', 'list') || can('types', 'root', 'all', 'list')) && <>
              <li className="menu-title">Menus del sistema</li>
              <MenuItemContainer title='Mantenimiento' icon='mdi mdi-application-cog'>
                {/* {
                  can('tables', 'root', 'all', 'list') &&
                  <MenuItem href='/tables' icon='mdi mdi-table'>Tablas</MenuItem>
                } */}
                {
                  can('statuses', 'root', 'all', 'list') &&
                  <MenuItem href='/statuses' icon='mdi mdi-format-list-checks'>Estados</MenuItem>
                }
                {
                  can('types', 'root', 'all', 'list') &&
                  <MenuItem href="/types" icon='mdi mdi-format-list-text'>Tipos</MenuItem>
                }
              </MenuItemContainer>
              {/* {
                can('views', 'root', 'all', 'list') &&
                <MenuItem href="/views" icon='mdi mdi-view-carousel'>Vistas</MenuItem>
              } */}
              {
                can('settings', 'root', 'all', 'list') &&
                <MenuItem href='/settings' icon='mdi mdi-cogs'>Configuraciones</MenuItem>
              }
            </>
          }
        </ul>

      </div>


      <div className="clearfix"></div>

    </div>


  </div>)
}

export default Menu