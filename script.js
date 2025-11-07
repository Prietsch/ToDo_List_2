// Classe para representar uma tarefa
class Task {
    constructor(id, title, responsible, startDate, endDate, priority, description, observations, completed = false) {
        this.id = id;
        this.title = title;
        this.responsible = responsible;
        this.startDate = startDate;
        this.endDate = endDate;
        this.priority = priority;
        this.description = description;
        this.observations = observations;
        this.completed = completed;
        this.createdAt = new Date().toISOString();
    }
}

// Classe principal da aplicação
class TodoApp {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.setupTabs();
        this.setupModal();
        this.updateCurrentDate();
        this.renderTasks();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formulário de adição de tarefa
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }

        // Validação de datas
        const startDateInput = document.getElementById('taskStartDate');
        const endDateInput = document.getElementById('taskEndDate');
        
        if (startDateInput) {
            startDateInput.addEventListener('change', () => {
                this.validateDates('taskStartDate', 'taskEndDate');
            });
        }

        if (endDateInput) {
            endDateInput.addEventListener('change', () => {
                this.validateDates('taskStartDate', 'taskEndDate');
            });
        }

        // Botões de controle de dados
        const saveDataBtn = document.getElementById('saveData');
        const loadDataBtn = document.getElementById('loadData');
        const clearDataBtn = document.getElementById('clearData');
        
        if (saveDataBtn) {
            saveDataBtn.addEventListener('click', () => {
                this.saveToLocalStorage();
            });
        }

        if (loadDataBtn) {
            loadDataBtn.addEventListener('click', () => {
                this.loadFromLocalStorage();
                this.renderTasks();
            });
        }

        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearLocalStorage();
            });
        }

        // Botão para excluir tarefas concluídas
        const clearCompletedBtn = document.getElementById('clearCompleted');
        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener('click', () => {
                this.clearCompletedTasks();
            });
        }

        // Botão para salvar edição de tarefa
        const saveEditTaskBtn = document.getElementById('saveEditTask');
        if (saveEditTaskBtn) {
            saveEditTaskBtn.addEventListener('click', () => {
                this.saveEditedTask();
            });
        }

        // Validação de caracteres nos campos de texto
        this.setupInputValidation();
    }

    // Configurar validação de inputs
    setupInputValidation() {
        const titleInput = document.getElementById('taskTitle');
        const responsibleInput = document.getElementById('taskResponsible');
        const descriptionInput = document.getElementById('taskDescription');
        const observationsInput = document.getElementById('taskObservations');

        // Validar título
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                if (titleInput.value.length > 100) {
                    titleInput.value = titleInput.value.substring(0, 100);
                }
            });
        }

        // Validar responsável
        if (responsibleInput) {
            responsibleInput.addEventListener('input', () => {
                if (responsibleInput.value.length > 50) {
                    responsibleInput.value = responsibleInput.value.substring(0, 50);
                }
            });
        }

        // Validar descrição
        if (descriptionInput) {
            descriptionInput.addEventListener('input', () => {
                if (descriptionInput.value.length > 500) {
                    descriptionInput.value = descriptionInput.value.substring(0, 500);
                }
            });
        }

        // Validar observações
        if (observationsInput) {
            observationsInput.addEventListener('input', () => {
                if (observationsInput.value.length > 300) {
                    observationsInput.value = observationsInput.value.substring(0, 300);
                }
            });
        }
    }

    // Configurar tabs
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        if (tabBtns.length === 0) return;
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                
                // Atualizar botões
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Atualizar panes
                tabPanes.forEach(pane => pane.classList.remove('active'));
                const targetPane = document.getElementById(`${tabName}-tasks`);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }

    // Configurar modal personalizado
    setupModal() {
        const modal = document.getElementById('editTaskModal');
        const closeBtn = document.getElementById('closeEditModal');
        const cancelBtn = document.getElementById('cancelEdit');
        
        if (!modal) return;
        
        const closeModal = () => {
            modal.classList.remove('active');
        };
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        
        // Fechar modal clicando fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Atualizar data atual
    updateCurrentDate() {
        const now = new Date();
        const optionsDay = { weekday: 'long' };
        const optionsDate = { day: 'numeric', month: 'long', year: 'numeric' };
        
        const dayString = now.toLocaleDateString('pt-BR', optionsDay);
        const dateString = now.toLocaleDateString('pt-BR', optionsDate);
        
        const dayElement = document.getElementById('currentDay');
        const dateElement = document.getElementById('currentDate');
        
        if (dayElement) dayElement.textContent = this.capitalizeFirst(dayString);
        if (dateElement) dateElement.textContent = dateString;
    }

    // Capitalizar primeira letra
    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Adicionar uma nova tarefa
    addTask() {
        const titleInput = document.getElementById('taskTitle');
        const responsibleInput = document.getElementById('taskResponsible');
        const startDateInput = document.getElementById('taskStartDate');
        const endDateInput = document.getElementById('taskEndDate');
        const prioritySelect = document.getElementById('taskPriority');
        const descriptionInput = document.getElementById('taskDescription');
        const observationsInput = document.getElementById('taskObservations');

        if (!titleInput || !responsibleInput || !startDateInput || !endDateInput || !prioritySelect) {
            this.showAlert('Erro: Campos do formulário não encontrados.', 'danger');
            return;
        }

        const title = titleInput.value.trim();
        const responsible = responsibleInput.value.trim();
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const priority = prioritySelect.value;
        const description = descriptionInput ? descriptionInput.value.trim() : '';
        const observations = observationsInput ? observationsInput.value.trim() : '';

        // Validação básica
        if (!title || !responsible || !startDate || !endDate || !priority) {
            this.showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
            return;
        }

        // Verificar se a data de término é posterior à data de início
        if (new Date(endDate) < new Date(startDate)) {
            this.showAlert('A data de término deve ser posterior à data de início.', 'warning');
            return;
        }

        // Criar nova tarefa
        const task = new Task(
            this.nextId++,
            title,
            responsible,
            startDate,
            endDate,
            priority,
            description,
            observations
        );

        this.tasks.push(task);
        this.renderTasks();
        
        // Reset do formulário
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.reset();
        }
        
        this.showAlert('Tarefa adicionada com sucesso!', 'success');
    }

    // Marcar tarefa como concluída
    markTaskAsCompleted(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = true;
            this.renderTasks();
            this.showAlert('Tarefa marcada como concluída!', 'success');
        }
    }

    // Excluir tarefa
    deleteTask(taskId) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.renderTasks();
            this.showAlert('Tarefa excluída com sucesso!', 'success');
        }
    }

    // Abrir modal para editar tarefa
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            // Preencher formulário de edição
            const editTaskId = document.getElementById('editTaskId');
            const editTaskTitle = document.getElementById('editTaskTitle');
            const editTaskResponsible = document.getElementById('editTaskResponsible');
            const editTaskStartDate = document.getElementById('editTaskStartDate');
            const editTaskEndDate = document.getElementById('editTaskEndDate');
            const editTaskPriority = document.getElementById('editTaskPriority');
            const editTaskDescription = document.getElementById('editTaskDescription');
            const editTaskObservations = document.getElementById('editTaskObservations');

            if (editTaskId) editTaskId.value = task.id;
            if (editTaskTitle) editTaskTitle.value = task.title;
            if (editTaskResponsible) editTaskResponsible.value = task.responsible;
            if (editTaskStartDate) editTaskStartDate.value = task.startDate;
            if (editTaskEndDate) editTaskEndDate.value = task.endDate;
            if (editTaskPriority) editTaskPriority.value = task.priority;
            if (editTaskDescription) editTaskDescription.value = task.description;
            if (editTaskObservations) editTaskObservations.value = task.observations;

            // Abrir modal personalizado
            const modal = document.getElementById('editTaskModal');
            if (modal) {
                modal.classList.add('active');
            }
        }
    }

    // Salvar tarefa editada
    saveEditedTask() {
        const editTaskId = document.getElementById('editTaskId');
        if (!editTaskId) return;

        const taskId = parseInt(editTaskId.value);
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            const editTaskTitle = document.getElementById('editTaskTitle');
            const editTaskResponsible = document.getElementById('editTaskResponsible');
            const editTaskStartDate = document.getElementById('editTaskStartDate');
            const editTaskEndDate = document.getElementById('editTaskEndDate');
            const editTaskPriority = document.getElementById('editTaskPriority');
            const editTaskDescription = document.getElementById('editTaskDescription');
            const editTaskObservations = document.getElementById('editTaskObservations');

            if (editTaskTitle) task.title = editTaskTitle.value.trim();
            if (editTaskResponsible) task.responsible = editTaskResponsible.value.trim();
            if (editTaskStartDate) task.startDate = editTaskStartDate.value;
            if (editTaskEndDate) task.endDate = editTaskEndDate.value;
            if (editTaskPriority) task.priority = editTaskPriority.value;
            if (editTaskDescription) task.description = editTaskDescription.value.trim();
            if (editTaskObservations) task.observations = editTaskObservations.value.trim();

            // Validação
            if (!task.title || !task.responsible || !task.startDate || !task.endDate) {
                this.showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
                return;
            }

            if (new Date(task.endDate) < new Date(task.startDate)) {
                this.showAlert('A data de término deve ser posterior à data de início.', 'warning');
                return;
            }

            this.renderTasks();
            
            // Fechar modal personalizado
            const modal = document.getElementById('editTaskModal');
            if (modal) {
                modal.classList.remove('active');
            }
            this.showAlert('Tarefa atualizada com sucesso!', 'success');
        }
    }

    // Excluir todas as tarefas concluídas
    clearCompletedTasks() {
        if (confirm('Tem certeza que deseja excluir todas as tarefas concluídas? Esta ação não pode ser desfeita.')) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.renderTasks();
            this.showAlert('Todas as tarefas concluídas foram excluídas.', 'success');
        }
    }

    // Renderizar as tarefas na interface
    renderTasks() {
        const pendingTasksContainer = document.getElementById('pendingTasks');
        const completedTasksContainer = document.getElementById('completedTasks');
        const emptyPending = document.getElementById('emptyPending');
        const emptyCompleted = document.getElementById('emptyCompleted');
        
        // Limpar containers
        if (pendingTasksContainer) pendingTasksContainer.innerHTML = '';
        if (completedTasksContainer) completedTasksContainer.innerHTML = '';
        
        // Filtrar tarefas
        const pendingTasks = this.tasks.filter(task => !task.completed);
        const completedTasks = this.tasks.filter(task => task.completed);
        
        // Atualizar contadores
        const pendingCountElement = document.getElementById('pendingCount');
        const completedCountElement = document.getElementById('completedCount');
        const pendingTabCountElement = document.getElementById('pendingTabCount');
        const completedTabCountElement = document.getElementById('completedTabCount');
        
        if (pendingCountElement) pendingCountElement.textContent = pendingTasks.length;
        if (completedCountElement) completedCountElement.textContent = completedTasks.length;
        if (pendingTabCountElement) pendingTabCountElement.textContent = pendingTasks.length;
        if (completedTabCountElement) completedTabCountElement.textContent = completedTasks.length;
        
        // Mostrar/ocultar estados vazios
        if (emptyPending) emptyPending.style.display = pendingTasks.length === 0 ? 'block' : 'none';
        if (emptyCompleted) emptyCompleted.style.display = completedTasks.length === 0 ? 'block' : 'none';
        
        // Renderizar tarefas pendentes
        pendingTasks.forEach(task => {
            if (pendingTasksContainer) {
                pendingTasksContainer.appendChild(this.createTaskCard(task));
            }
        });
        
        // Renderizar tarefas concluídas
        completedTasks.forEach(task => {
            if (completedTasksContainer) {
                completedTasksContainer.appendChild(this.createTaskCard(task));
            }
        });
    }

    // Criar cartão de tarefa
    createTaskCard(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card priority-${task.priority}`;
        
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.title)}</div>
                <span class="priority-badge">${this.getPriorityText(task.priority)}</span>
            </div>
            <div class="task-meta">
                <div class="meta-item">
                    <i class="bi bi-person"></i>
                    <span>${this.escapeHtml(task.responsible)}</span>
                </div>
                <div class="meta-item">
                    <i class="bi bi-calendar-event"></i>
                    <span>${this.formatDate(task.startDate)} - ${this.formatDate(task.endDate)}</span>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            ${task.observations ? `
                <div class="task-observations">
                    <div class="observations-label">Observações</div>
                    <div class="observations-text">${this.escapeHtml(task.observations)}</div>
                </div>
            ` : ''}
            <div class="task-actions">
                ${!task.completed ? `
                    <button class="action-btn success complete-task" data-id="${task.id}" title="Marcar como concluída">
                        <i class="bi bi-check-lg"></i>
                    </button>
                    <button class="action-btn primary edit-task" data-id="${task.id}" title="Editar tarefa">
                        <i class="bi bi-pencil"></i>
                    </button>
                ` : ''}
                <button class="action-btn danger delete-task" data-id="${task.id}" title="Excluir tarefa">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        // Adicionar event listeners aos botões
        if (!task.completed) {
            const completeBtn = taskElement.querySelector('.complete-task');
            if (completeBtn) {
                completeBtn.addEventListener('click', () => {
                    this.markTaskAsCompleted(task.id);
                });
            }
            
            const editBtn = taskElement.querySelector('.edit-task');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.editTask(task.id);
                });
            }
        }
        
        const deleteBtn = taskElement.querySelector('.delete-task');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteTask(task.id);
            });
        }
        
        return taskElement;
    }

    // Escapar HTML para prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Obter texto da prioridade
    getPriorityText(priority) {
        switch (priority) {
            case 'high': return 'Alta';
            case 'medium': return 'Média';
            case 'low': return 'Baixa';
            default: return 'Não definida';
        }
    }

    // Formatar data para exibição
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Validar datas
    validateDates(startDateId, endDateId) {
        const startDate = document.getElementById(startDateId);
        const endDate = document.getElementById(endDateId);
        
        if (!startDate || !endDate) return;
        
        if (startDate.value && endDate.value && new Date(endDate.value) < new Date(startDate.value)) {
            endDate.classList.add('is-invalid');
            startDate.classList.add('is-invalid');
        } else {
            endDate.classList.remove('is-invalid');
            startDate.classList.remove('is-invalid');
        }
    }

    // Mostrar alerta
    showAlert(message, type) {
        // Remover alertas existentes
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Criar elemento de alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert-${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <span class="alert-message">${message}</span>
                <button class="alert-close">&times;</button>
            </div>
        `;
        
        // Estilos do alerta
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
            min-width: 300px;
            background: ${this.getAlertColor(type)};
            color: white;
            border-radius: 10px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            animation: slideInRight 0.3s ease;
        `;
        
        const alertContent = alertDiv.querySelector('.alert-content');
        alertContent.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.25rem;
        `;
        
        const alertClose = alertDiv.querySelector('.alert-close');
        alertClose.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.25rem;
            cursor: pointer;
            padding: 0;
            margin-left: 1rem;
        `;
        
        alertClose.addEventListener('click', () => {
            alertDiv.remove();
        });
        
        document.body.appendChild(alertDiv);
        
        // Adicionar animação CSS se não existir
        if (!document.querySelector('#alert-animations')) {
            const style = document.createElement('style');
            style.id = 'alert-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remover alerta após 3 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }

    // Obter cor do alerta baseado no tipo
    getAlertColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            danger: 'linear-gradient(135deg, #ef4444, #dc2626)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        return colors[type] || colors.info;
    }

    // Salvar dados no localStorage
    saveToLocalStorage() {
        const data = {
            tasks: this.tasks,
            nextId: this.nextId
        };
        
        try {
            localStorage.setItem('todoAppData', JSON.stringify(data));
            this.showAlert('Dados salvos com sucesso no localStorage!', 'success');
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
            this.showAlert('Erro ao salvar dados no localStorage. O storage pode estar cheio.', 'danger');
        }
    }

    // Carregar dados do localStorage
    loadFromLocalStorage() {
        const data = localStorage.getItem('todoAppData');
        
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                this.tasks = parsedData.tasks.map(task => {
                    return new Task(
                        task.id,
                        task.title,
                        task.responsible,
                        task.startDate,
                        task.endDate,
                        task.priority,
                        task.description || '',
                        task.observations || '',
                        task.completed || false
                    );
                });
                this.nextId = parsedData.nextId || this.tasks.length + 1;
                this.showAlert('Dados recuperados com sucesso do localStorage!', 'success');
            } catch (e) {
                console.error('Erro ao carregar dados:', e);
                this.showAlert('Erro ao carregar dados do localStorage. Os dados podem estar corrompidos.', 'danger');
            }
        } else {
            this.showAlert('Nenhum dado encontrado no localStorage.', 'info');
        }
    }

    // Limpar localStorage
    clearLocalStorage() {
        if (confirm('Tem certeza que deseja limpar todos os dados do localStorage? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('todoAppData');
            this.tasks = [];
            this.nextId = 1;
            this.renderTasks();
            this.showAlert('Dados do localStorage foram limpos com sucesso!', 'success');
        }
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
