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
        this.stateHistory = [];
        this.currentStateIndex = -1;
        this.maxHistoryStates = 20;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.setupTabs();
        this.setupModal();
        this.updateCurrentDate();
        this.renderTasks();
        this.saveState();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formulário de adição de tarefa
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Validação de datas
        document.getElementById('taskStartDate').addEventListener('change', () => {
            this.validateDates('taskStartDate', 'taskEndDate');
        });

        document.getElementById('taskEndDate').addEventListener('change', () => {
            this.validateDates('taskStartDate', 'taskEndDate');
        });

        // Botões de controle de dados
        document.getElementById('saveData').addEventListener('click', () => {
            this.saveToLocalStorage();
        });

        document.getElementById('loadData').addEventListener('click', () => {
            this.loadFromLocalStorage();
            this.renderTasks();
            this.saveState();
        });

        document.getElementById('clearData').addEventListener('click', () => {
            this.clearLocalStorage();
        });

        // Botão para excluir tarefas concluídas
        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.clearCompletedTasks();
        });

        // Botão para salvar edição de tarefa
        document.getElementById('saveEditTask').addEventListener('click', () => {
            this.saveEditedTask();
        });

        // Botões desfazer/refazer
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });
        
        document.getElementById('redoBtn').addEventListener('click', () => {
            this.redo();
        });
        
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                if (e.key === 'z' || e.key === 'Z') {
                    e.preventDefault();
                    this.undo();
                } else if (e.key === 'y' || e.key === 'Y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });

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
        titleInput.addEventListener('input', () => {
            if (titleInput.value.length > 100) {
                titleInput.value = titleInput.value.substring(0, 100);
            }
        });

        // Validar responsável
        responsibleInput.addEventListener('input', () => {
            if (responsibleInput.value.length > 50) {
                responsibleInput.value = responsibleInput.value.substring(0, 50);
            }
        });

        // Validar descrição
        descriptionInput.addEventListener('input', () => {
            if (descriptionInput.value.length > 500) {
                descriptionInput.value = descriptionInput.value.substring(0, 500);
            }
        });

        // Validar observações
        observationsInput.addEventListener('input', () => {
            if (observationsInput.value.length > 300) {
                observationsInput.value = observationsInput.value.substring(0, 300);
            }
        });
    }

    // Configurar tabs
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                
                // Atualizar botões
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Atualizar panes
                tabPanes.forEach(pane => pane.classList.remove('active'));
                document.getElementById(`${tabName}-tasks`).classList.add('active');
            });
        });
    }

    // Configurar modal personalizado
    setupModal() {
        const modal = document.getElementById('editTaskModal');
        const closeBtn = document.getElementById('closeEditModal');
        const cancelBtn = document.getElementById('cancelEdit');
        
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
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = now.toLocaleDateString('pt-BR', options);
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = dateString;
        }
    }

    // Salvar estado atual no histórico
    saveState() {
        // Remove estados "futuros" se estamos no meio do histórico
        if (this.currentStateIndex < this.stateHistory.length - 1) {
            this.stateHistory = this.stateHistory.slice(0, this.currentStateIndex + 1);
        }
        
        // Salva o estado atual
        const currentState = {
            tasks: JSON.parse(JSON.stringify(this.tasks)), // Deep clone
            nextId: this.nextId,
            timestamp: new Date().toISOString()
        };
        
        this.stateHistory.push(currentState);
        this.currentStateIndex = this.stateHistory.length - 1;
        
        // Limita o tamanho do histórico
        if (this.stateHistory.length > this.maxHistoryStates) {
            this.stateHistory.shift();
            this.currentStateIndex--;
        }
        
        this.updateUndoRedoButtons();
    }

    // Desfazer (CTRL+Z)
    undo() {
        if (this.currentStateIndex > 0) {
            this.currentStateIndex--;
            this.loadState(this.currentStateIndex);
            this.showAlert('Ação desfeita!', 'info');
        } else {
            this.showAlert('Não há mais ações para desfazer.', 'warning');
        }
    }

    // Refazer (CTRL+Y)
    redo() {
        if (this.currentStateIndex < this.stateHistory.length - 1) {
            this.currentStateIndex++;
            this.loadState(this.currentStateIndex);
            this.showAlert('Ação refeita!', 'info');
        } else {
            this.showAlert('Não há mais ações para refazer.', 'warning');
        }
    }

    // Carregar estado específico
    loadState(index) {
        const state = this.stateHistory[index];
        if (state) {
            this.tasks = state.tasks.map(task => {
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
            this.nextId = state.nextId || this.tasks.length + 1;
            this.renderTasks();
            this.updateUndoRedoButtons();
        }
    }

    // Atualizar visibilidade dos botões desfazer/refazer
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = this.currentStateIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.currentStateIndex >= this.stateHistory.length - 1;
    }

    // Adicionar uma nova tarefa
    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const responsible = document.getElementById('taskResponsible').value.trim();
        const startDate = document.getElementById('taskStartDate').value;
        const endDate = document.getElementById('taskEndDate').value;
        const priority = document.getElementById('taskPriority').value;
        const description = document.getElementById('taskDescription').value.trim();
        const observations = document.getElementById('taskObservations').value.trim();

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

        // Salvar estado antes da modificação
        this.saveState();

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
        document.getElementById('taskForm').reset();
        this.showAlert('Tarefa adicionada com sucesso!', 'success');
    }

    // Marcar tarefa como concluída
    markTaskAsCompleted(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            // Salvar estado antes da modificação
            this.saveState();
            
            task.completed = true;
            this.renderTasks();
            this.showAlert('Tarefa marcada como concluída!', 'success');
        }
    }

    // Excluir tarefa
    deleteTask(taskId) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            // Salvar estado antes da modificação
            this.saveState();
            
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.renderTasks();
            this.showAlert('Tarefa excluída com sucesso!', 'success');
        }
    }

    // Abrir modal para editar tarefa
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('editTaskId').value = task.id;
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskResponsible').value = task.responsible;
            document.getElementById('editTaskStartDate').value = task.startDate;
            document.getElementById('editTaskEndDate').value = task.endDate;
            document.getElementById('editTaskPriority').value = task.priority;
            document.getElementById('editTaskDescription').value = task.description;
            document.getElementById('editTaskObservations').value = task.observations;

            // Abrir modal personalizado
            document.getElementById('editTaskModal').classList.add('active');
        }
    }

    // Salvar tarefa editada
    saveEditedTask() {
        const taskId = parseInt(document.getElementById('editTaskId').value);
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            // Salvar estado antes da modificação
            this.saveState();
            
            task.title = document.getElementById('editTaskTitle').value.trim();
            task.responsible = document.getElementById('editTaskResponsible').value.trim();
            task.startDate = document.getElementById('editTaskStartDate').value;
            task.endDate = document.getElementById('editTaskEndDate').value;
            task.priority = document.getElementById('editTaskPriority').value;
            task.description = document.getElementById('editTaskDescription').value.trim();
            task.observations = document.getElementById('editTaskObservations').value.trim();

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
            document.getElementById('editTaskModal').classList.remove('active');
            this.showAlert('Tarefa atualizada com sucesso!', 'success');
        }
    }

    // Excluir todas as tarefas concluídas
    clearCompletedTasks() {
        if (confirm('Tem certeza que deseja excluir todas as tarefas concluídas? Esta ação não pode ser desfeita.')) {
            // Salvar estado antes da modificação
            this.saveState();
            
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
        
        const priorityClass = `priority-${task.priority}`;
        
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
        const startDate = document.getElementById(startDateId).value;
        const endDate = document.getElementById(endDateId).value;
        
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            document.getElementById(endDateId).classList.add('is-invalid');
            document.getElementById(startDateId).classList.add('is-invalid');
        } else {
            document.getElementById(endDateId).classList.remove('is-invalid');
            document.getElementById(startDateId).classList.remove('is-invalid');
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
            info: 'linear-gradient(135deg, #6366f1, #4f46e5)'
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
            this.stateHistory = [];
            this.currentStateIndex = -1;
            this.renderTasks();
            this.saveState();
            this.showAlert('Dados do localStorage foram limpos com sucesso!', 'success');
        }
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
