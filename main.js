// Inicializar cultura padrão
// Função para verificar se todas as dependências estão carregadas
function checkDependencies() {
    var dependencies = [
        { name: 'Syncfusion ej', check: function() { return typeof ej !== 'undefined'; } },
        { name: 'getProjectDataByLocale', check: function() { return typeof getProjectDataByLocale !== 'undefined'; } }
    ];

    for (var i = 0; i < dependencies.length; i++) {
        if (!dependencies[i].check()) {
            console.warn('Dependência não carregada:', dependencies[i].name);
            return false;
        }
    }
    return true;
}

// Inicializar cultura com fallback seguro
try {
    if (typeof ej !== 'undefined' && ej.base && ej.base.setCulture) {
        ej.base.setCulture('en-US');
        console.log('Cultura en-US definida');
    } else {
        console.warn('Syncfusion não disponível para definir cultura');
    }
} catch (error) {
    console.error('Erro ao inicializar cultura:', error);
}

// Função para exibir predecessores de forma amigável na coluna
function displayPredecessors(field, data, column) {
    if (data.Predecessor) {
        // Remove FS de cada predecessor para exibir apenas os IDs
        return data.Predecessor.replace(/(\d+)FS/g, '$1').replace(/;/g, ', ');
    }
    return '';
}

var ganttChart;
try {
    // Verificar se as dependências estão carregadas
    if (!checkDependencies()) {
        throw new Error('Depend��ncias não carregadas. Verifique se todos os scripts foram carregados.');
    }

    ganttChart = new ej.gantt.Gantt({
    dataSource: getProjectDataByLocale('pt-BR'),
    width: '100%',
    height: '100%',
    locale: 'en-US',
    taskFields: {
        id: 'TaskID',
        name: 'TaskName',
        startDate: 'StartDate',
        endDate: 'EndDate',
        duration: 'Duration',
        progress: 'Progress',
        dependency: 'Predecessor',
        child: 'subtasks'
    },
    allowSorting: true,
    allowSelection: true,
    allowResizing: true,
    allowReordering: true,
    selectionSettings: {
        mode: 'Row',
        type: 'Single'
    },
    treeColumnIndex: 1,
    showColumnMenu: false,
    allowExcelExport: true,
    allowPdfExport: true,
    allowRowDragAndDrop: true,
    editSettings: {
        allowAdding: true,
        allowEditing: true,
        allowDeleting: true,
        allowTaskbarEditing: true,
        mode: 'Cell',
        showDeleteConfirmDialog: true
    },
    toolbar: ['Update', 'Delete', 'Cancel', 'ExpandAll', 'CollapseAll', 'Indent', 'Outdent', 'ExcelExport', 'PdfExport', 'Search', 'ZoomIn', 'ZoomOut', 'ZoomToFit'],
    highlightWeekends: true,
    timelineSettings: {
        timelineUnitSize: 100,
        topTier: {
            unit: 'Month',
            format: 'MMM yyyy'
        },
        bottomTier: {
            unit: 'Week',
            format: 'dd/MM'
        }
    },
    columns: [
        { field: 'TaskID', headerText: 'ID', width: 50, textAlign: 'Center', allowEditing: false },
        { field: 'TaskName', headerText: 'Tarefa', width: 250, allowEditing: true, clipMode: 'EllipsisWithTooltip' },
        { field: 'StartDate', headerText: 'Início', width: 90, allowEditing: true, editType: 'datepickeredit',
          edit: { params: { locale: 'en-US', format: 'M/d/yyyy' } } },
        { field: 'EndDate', headerText: 'Fim', width: 90, textAlign: 'Center', allowEditing: true, editType: 'datepickeredit',
          edit: { params: { locale: 'en-US', format: 'M/d/yyyy' } } },
        { field: 'Duration', headerText: 'Duração', width: 80, textAlign: 'Center', allowEditing: true, editType: 'numericedit',
          edit: { params: { min: 1, max: 999, step: 1, format: 'n0' } } },
        { field: 'Progress', headerText: 'Prog.', width: 70, textAlign: 'Center', allowEditing: true },
        { field: 'Predecessor', headerText: 'Predecessores', width: 120, textAlign: 'Left', allowEditing: true, clipMode: 'EllipsisWithTooltip',
          valueAccessor: displayPredecessors }
    ],
    labelSettings: {
        leftLabel: 'TaskName',
        rightLabel: 'Progress',
        taskLabel: '${Progress}%'
    },
    splitterSettings: {
        columnIndex: 3
    },
    projectStartDate: new Date('08/01/2025'),
    projectEndDate: new Date('08/31/2025'),
    zoomSettings: {
        enable: true,
        zoomIn: true,
        zoomOut: true,
        zoomToFit: true
    },
    // DRAG AND DROP BÁSICO - SEM CUSTOMIZAÇÕES
    rowDrop: function (args) {
        // Comportamento padrão do Syncfusion - sem interceptações
        console.log('Row drop:', args.data[0] ? args.data[0].TaskName : 'Unknown');
    },

    // EVENTO DE SELEÇÃO DE LINHA
    rowSelected: function (args) {
        if (args.rowIndex !== undefined) {
            currentSelectedRowIndex = args.rowIndex;
            console.log('Linha selecionada:', args.rowIndex);
        }
    },

    rowDeselected: function (args) {
        if (args.rowIndex === currentSelectedRowIndex) {
            currentSelectedRowIndex = -1;
            console.log('Linha desselecionada:', args.rowIndex);
        }
    },

    actionBegin: function (args) {
        // Processa predecessores antes de salvar
        if (args.requestType === 'save' && args.data && args.data.Predecessor !== undefined) {
            var originalValue = args.data.Predecessor;

            // Validar predecessores
            var validation = validatePredecessors(originalValue, args.data.TaskID);
            if (!validation.isValid) {
                args.cancel = true;
                alert('Erro nos predecessores: ' + validation.message);
                return;
            }

            // Processar predecessores com regra FS
            var processedPredecessors = parsePredecessors(originalValue);
            args.data.Predecessor = processedPredecessors;

            console.log('Predecessores processados:', originalValue, '->', processedPredecessors);
        }

        // Respeitar links de predecessores durante validação
        if (args.requestType === 'validateLinkedTask') {
            args.validateMode = { respectLink: true };
        }
    },

    actionComplete: function (args) {
        // Log para acompanhar alterações de predecessores
        if (args.requestType === 'save' && args.data && args.data.Predecessor !== undefined) {
            console.log('Predecessores salvos para tarefa', args.data.TaskID + ':', args.data.Predecessor);
        }

        // Detectar quando uma nova tarefa foi adicionada
        if (args.requestType === 'add' && args.data) {
            console.log('Nova tarefa adicionada via evento:', args.data.TaskID);

            // Aguardar um pouco e então iniciar edição se for nossa nova tarefa
            setTimeout(function() {
                if (window.shouldEditNewTask && args.data.TaskID === window.newTaskIdToEdit) {
                    window.shouldEditNewTask = false;

                    // Encontrar o índice da nova tarefa
                    var newRowIndex = -1;
                    if (ganttChart.flatData) {
                        for (var i = 0; i < ganttChart.flatData.length; i++) {
                            if (ganttChart.flatData[i].TaskID === args.data.TaskID) {
                                newRowIndex = i;
                                break;
                            }
                        }
                    }

                    if (newRowIndex >= 0) {
                        console.log('Iniciando edição da nova tarefa na linha:', newRowIndex);
                        currentSelectedRowIndex = newRowIndex;

                        // Selecionar e editar
                        if (ganttChart.selectRow) {
                            ganttChart.selectRow(newRowIndex);
                        }

                        setTimeout(function() {
                            if (ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                                ganttChart.treeGrid.editCell(newRowIndex, 'TaskName');

                                // Limpar o campo
                                setTimeout(function() {
                                    var input = document.querySelector('.e-treegrid .e-rowcell input');
                                    if (input) {
                                        input.value = '';
                                        input.focus();
                                        input.select();
                                        console.log('✅ Nova tarefa em edição com campo limpo');
                                    }
                                }, 100);
                            }
                        }, 200);
                    }
                }
            }, 100);
        }
    },

    // Evento para garantir que células sejam editáveis por duplo clique
    cellEdit: function (args) {
        // Permitir edição de todas as células editáveis
        return true;
    },

    // Evento para capturar cliques nos botões da toolbar
    toolbarClick: function (args) {
        if (args.item.id === ganttChart.element.id + '_indent') {
            // Botão Indent clicado
            if (currentSelectedRowIndex > 0) {
                console.log('🎯 Botão Indent clicado. Linha atual:', currentSelectedRowIndex);
                moveTaskAsSubtask(currentSelectedRowIndex);
            } else {
                console.log('Não é possível fazer indent: primeira linha ou nenhuma linha selecionada');
            }
        } else if (args.item.id === ganttChart.element.id + '_outdent') {
            // Botão Outdent clicado
            if (currentSelectedRowIndex >= 0) {
                console.log('🎯 Botão Outdent clicado. Linha atual:', currentSelectedRowIndex);
                outdentTask(currentSelectedRowIndex);
            } else {
                console.log('Não é possível fazer outdent: nenhuma linha selecionada');
            }
        }
    },

    // Evento para controlar estado dos botões da toolbar
    toolbarRender: function (args) {
        // Forçar botões Indent e Outdent sempre visíveis
        setTimeout(function() {
            var indentButton = document.querySelector('#' + ganttChart.element.id + '_indent');
            var outdentButton = document.querySelector('#' + ganttChart.element.id + '_outdent');
            
            if (indentButton) {
                indentButton.style.display = 'inline-block';
                indentButton.style.visibility = 'visible';
            }
            
            if (outdentButton) {
                outdentButton.style.display = 'inline-block';
                outdentButton.style.visibility = 'visible';
            }
        }, 100);
    },

    // Evento para atualizar estado dos botões baseado na seleção
    rowSelected: function (args) {
        if (args.rowIndex !== undefined) {
            currentSelectedRowIndex = args.rowIndex;
            console.log('Linha selecionada:', args.rowIndex);
            
            // Atualizar estado dos botões
            updateToolbarButtonStates();
        }
    },

    rowDeselected: function (args) {
        if (args.rowIndex === currentSelectedRowIndex) {
            currentSelectedRowIndex = -1;
            console.log('Linha desselecionada:', args.rowIndex);
            
            // Atualizar estado dos botões
            updateToolbarButtonStates();
        }
    }
    });
} catch (error) {
    console.error('Erro ao inicializar Gantt Chart:', error);
    alert('Erro ao carregar o gráfico Gantt: ' + error.message);

    // Tentar reinicializar com dados padrão
    try {
        console.log('Tentando reinicialização com dados mínimos...');
        ganttChart = new ej.gantt.Gantt({
            dataSource: [],
            width: '100%',
            height: '100%',
            locale: 'en-US'
        });
    } catch (fallbackError) {
        console.error('Falha na reinicialização:', fallbackError);
    }
}

// FUNÇÕES DE PREDECESSOR - MANTIDAS
// Função para parsing de predecessores separados por vírgula e aplicação da regra FS
function parsePredecessors(predecessorString) {
    if (!predecessorString || predecessorString.trim() === '') {
        return '';
    }

    // Remove espaços e quebra em vírgulas
    var predecessorIds = predecessorString.split(',').map(function(id) { return id.trim(); }).filter(function(id) { return id !== ''; });

    // Aplica a regra FS a cada predecessor se não estiver especificada
    var processedPredecessors = predecessorIds.map(function(id) {
        // Remove caracteres não numéricos e verifica se é um número válido
        var numericId = id.replace(/[^\d]/g, '');
        if (numericId && !isNaN(numericId)) {
            // Se já contém uma regra (FS, SS, FF, SF), mantém como está
            if (id.match(/\d+(FS|SS|FF|SF)/)) {
                return id;
            } else {
                // Aplica a regra FS automaticamente
                return numericId + 'FS';
            }
        }
        return null;
    }).filter(function(pred) { return pred !== null; });

    return processedPredecessors.join(';');
}

// Função para validar se os predecessores existem
function validatePredecessors(predecessorString, currentTaskId) {
    if (!predecessorString || predecessorString.trim() === '') {
        return { isValid: true, message: '' };
    }

    var predecessorIds = predecessorString.split(',').map(function(id) { return id.trim().replace(/[^\d]/g, ''); });
    var allTaskIds = getAllTaskIds();

    for (var i = 0; i < predecessorIds.length; i++) {
        var predId = predecessorIds[i];
        if (predId === '') continue;

        var numericPredId = parseInt(predId);

        // Verifica se o predecessor existe
        if (!allTaskIds.includes(numericPredId)) {
            return {
                isValid: false,
                message: `Tarefa ${numericPredId} não existe.`
            };
        }

        // Verifica se não está tentando criar dependência circular
        if (numericPredId === currentTaskId) {
            return {
                isValid: false,
                message: 'Uma tarefa não pode ser predecessora de si mesma.'
            };
        }
    }

    return { isValid: true, message: '' };
}

// Função para obter todos os IDs de tarefas
function getAllTaskIds() {
    const taskIds = [];

    function extractIds(data) {
        for (const item of data) {
            taskIds.push(item.TaskID);
            if (item.subtasks && item.subtasks.length > 0) {
                extractIds(item.subtasks);
            }
        }
    }

    extractIds(ganttChart.dataSource);
    return taskIds;
}

// Função para obter mensagens traduzidas
function getMessages(locale) {
    const messages = {
        'en-US': {
            confirmClear: 'Are you sure you want to clear all tasks? This action cannot be undone.',
            confirmRestore: 'Do you want to restore the default project data?',
            clearSuccess: 'All tasks have been removed successfully!',
            restoreSuccess: 'Default data restored successfully!',
            clearError: 'Error clearing tasks: ',
            restoreError: 'Error restoring data: ',
            ganttNotAvailable: 'Gantt Chart is not available',
            newTaskName: 'New Task'
        },
        'pt-BR': {
            confirmClear: 'Tem certeza que deseja limpar todas as tarefas? Esta ação não pode ser desfeita.',
            confirmRestore: 'Deseja restaurar os dados padrão do projeto?',
            clearSuccess: 'Todas as tarefas foram removidas com sucesso!',
            restoreSuccess: 'Dados padrão restaurados com sucesso!',
            clearError: 'Erro ao limpar tarefas: ',
            restoreError: 'Erro ao restaurar dados: ',
            ganttNotAvailable: 'Gantt Chart não está disponível',
            newTaskName: 'Nova Tarefa'
        },
        'es-ES': {
            confirmClear: '¿Está seguro de que desea limpiar todas las tareas? Esta acción no se puede deshacer.',
            confirmRestore: '¿Desea restaurar los datos por defecto del proyecto?',
            clearSuccess: '¡Todas las tareas han sido eliminadas con éxito!',
            restoreSuccess: '¡Datos por defecto restaurados con éxito!',
            clearError: 'Error al limpiar tareas: ',
            restoreError: 'Error al restaurar datos: ',
            ganttNotAvailable: 'Gantt Chart no está disponible',
            newTaskName: 'Nueva Tarea'
        }
    };
    return messages[locale] || messages['en-US'];
}

// Função para limpar todas as tasks do data source
function clearAllTasks() {
    if (ganttChart) {
        try {
            // Obter idioma atual
            var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
            var msgs = getMessages(currentLanguage);

            // Confirmar ação com o usuário
            var confirmClear = confirm(msgs.confirmClear);

            if (confirmClear) {
                // Limpar o data source
                ganttChart.dataSource = [];

                // Atualizar o componente
                ganttChart.refresh();

                // Aguardar um momento para o refresh completar e então adicionar nova linha
                setTimeout(function() {
                    try {
                        // Criar uma nova tarefa com nome traduzido
                        var newTask = {
                            TaskID: 1,
                            TaskName: msgs.newTaskName,
                            StartDate: new Date(),
                            Duration: 1,
                            Progress: 0
                        };

                        // Adicionar a nova tarefa
                        ganttChart.addRecord(newTask);
                        console.log('Nova tarefa adicionada:', newTask);

                        // Aguardar um pouco mais e então iniciar edição na primeira linha
                        setTimeout(function() {
                            try {
                                // Verificar se a linha foi realmente adicionada
                                if (!ganttChart.dataSource || ganttChart.dataSource.length === 0) {
                                    console.log('Nenhuma linha encontrada para editar');
                                    return;
                                }

                                console.log('Tentando iniciar edição. Linhas disponíveis:', ganttChart.dataSource.length);

                                // Método correto 1: usar treeGrid.editCell para editar célula específica
                                if (ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                                    ganttChart.treeGrid.editCell(0, 'TaskName');
                                    console.log('Edição iniciada via treeGrid.editCell');
                                }
                                // Método correto 2: usar startEdit com taskId
                                else if (ganttChart.startEdit) {
                                    ganttChart.startEdit(1); // ID da nova tarefa criada
                                    console.log('Edição iniciada via startEdit com taskId');
                                }
                                // Método correto 3: usar beginEdit com o registro
                                else if (ganttChart.beginEdit && ganttChart.dataSource && ganttChart.dataSource.length > 0) {
                                    ganttChart.beginEdit(ganttChart.dataSource[0]);
                                    console.log('Edição iniciada via beginEdit com record');
                                }

                                // Aguardar um pouco mais para focar no campo TaskName
                                setTimeout(function() {
                                    try {
                                        // Tentar focar no campo TaskName com múltiplos seletores
                                        var taskNameInput = document.querySelector(
                                            '.e-treegrid .e-editedbatchcell input, ' +
                                            '.e-treegrid .e-inline-edit input[aria-label*="Task"], ' +
                                            '.e-treegrid .e-inline-edit input[name="TaskName"], ' +
                                            '.e-treegrid .e-editedrow input, ' +
                                            '.e-treegrid td[aria-describedby*="TaskName"] input, ' +
                                            '.e-treegrid .e-rowcell input[aria-label*="TaskName"], ' +
                                            'input[aria-label*="Task Name"]'
                                        );
                                        if (taskNameInput) {
                                            taskNameInput.focus();
                                            taskNameInput.select(); // Selecionar o texto para facilitar edição
                                            console.log('Campo TaskName focado automaticamente');
                                        } else {
                                            console.log('Campo TaskName não encontrado para foco automático');
                                        }
                                    } catch (focusError) {
                                        console.log('Não foi possível focar no campo TaskName automaticamente:', focusError);
                                    }
                                }, 200);

                                console.log('Nova linha criada e colocada em modo de edição');
                            } catch (editError) {
                                console.error('Erro ao iniciar edição:', editError);
                                console.log('Métodos de edição disponíveis:', {
                                    'treeGrid.editCell': !!(ganttChart.treeGrid && ganttChart.treeGrid.editCell),
                                    'startEdit': !!(ganttChart.startEdit),
                                    'beginEdit': !!(ganttChart.beginEdit)
                                });
                            }
                        }, 300);

                    } catch (addError) {
                        console.error('Erro ao adicionar nova linha:', addError);
                    }
                }, 300);

                console.log('Todas as tarefas foram removidas do data source');
                alert(msgs.clearSuccess);
            }
        } catch (error) {
            var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
            var msgs = getMessages(currentLanguage);
            console.error('Erro ao limpar tasks:', error);
            alert(msgs.clearError + error.message);
        }
    } else {
        var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
        var msgs = getMessages(currentLanguage);
        console.error('Gantt Chart não está inicializado');
        alert(msgs.ganttNotAvailable);
    }
}

// Função para restaurar dados padrão baseado no idioma atual
function restoreDefaultTasks() {
    if (ganttChart) {
        try {
            // Obter idioma atual do seletor
            var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
            var msgs = getMessages(currentLanguage);

            // Confirmar ação com o usuário
            var confirmRestore = confirm(msgs.confirmRestore);

            if (confirmRestore) {
                // Restaurar dados padrão
                ganttChart.dataSource = getProjectDataByLocale(currentLanguage);

                // Atualizar o componente
                ganttChart.refresh();

                // Ajustar zoom após carregar dados
                setTimeout(function() {
                    if (ganttChart && ganttChart.fitToProject) {
                        ganttChart.fitToProject();
                    }
                }, 200);

                console.log('Dados padrão restaurados para idioma:', currentLanguage);
                alert(msgs.restoreSuccess);
            }
        } catch (error) {
            var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
            var msgs = getMessages(currentLanguage);
            console.error('Erro ao restaurar dados padrão:', error);
            alert(msgs.restoreError + error.message);
        }
    }
}

// Variável para armazenar a linha atualmente selecionada
var currentSelectedRowIndex = -1;

// Função para atualizar estado dos botões da toolbar
function updateToolbarButtonStates() {
    if (!ganttChart || !ganttChart.element) return;
    
    try {
        // Encontrar botões na toolbar
        var indentButton = document.querySelector('#' + ganttChart.element.id + '_indent');
        var outdentButton = document.querySelector('#' + ganttChart.element.id + '_outdent');
        
        if (indentButton) {
            // Forçar sempre visível
            indentButton.style.display = 'inline-block';
            indentButton.style.visibility = 'visible';
            
            // Indent: desabilitar se for primeira linha ou nenhuma linha selecionada
            var canIndent = currentSelectedRowIndex > 0;
            indentButton.disabled = !canIndent;
            indentButton.style.opacity = canIndent ? '1' : '0.5';
            indentButton.style.cursor = canIndent ? 'pointer' : 'not-allowed';
        }
        
        if (outdentButton) {
            // Forçar sempre visível
            outdentButton.style.display = 'inline-block';
            outdentButton.style.visibility = 'visible';
            
            // Outdent: desabilitar se nenhuma linha selecionada ou se não é subtarefa
            var canOutdent = currentSelectedRowIndex >= 0;
            
            // Verificar se a tarefa selecionada é uma subtarefa
            if (canOutdent && ganttChart.flatData && ganttChart.flatData[currentSelectedRowIndex]) {
                var selectedTask = ganttChart.flatData[currentSelectedRowIndex];
                // Verificar se tem parent (é subtarefa)
                canOutdent = selectedTask.parentItem != null;
            }
            
            outdentButton.disabled = !canOutdent;
            outdentButton.style.opacity = canOutdent ? '1' : '0.5';
            outdentButton.style.cursor = canOutdent ? 'pointer' : 'not-allowed';
        }
        
    } catch (error) {
        console.log('Erro ao atualizar estado dos botões:', error);
    }
}


// Função utilitária para focar no campo TaskName após iniciar ediç��o
function focusTaskNameField() {
    setTimeout(function() {
        var taskNameInput = document.querySelector('.e-treegrid .e-rowcell input');
        if (taskNameInput) {
            taskNameInput.focus();
            taskNameInput.select();
            console.log('✅ Campo TaskName focado e selecionado');
        } else {
            console.log('❌ Campo TaskName não encontrado para foco');
            // Tentar novamente após um tempo
            setTimeout(function() {
                var input = document.querySelector('.e-treegrid .e-rowcell input');
                if (input) {
                    input.focus();
                    input.select();
                    console.log('✅ Campo TaskName focado na segunda tentativa');
                }
            }, 200);
        }
    }, 100);
}

// Função para verificar se está na última linha visível
function isLastVisibleRow() {
    if (currentSelectedRowIndex < 0 || !ganttChart) {
        console.log('isLastVisibleRow: linha não selecionada ou gantt não disponível');
        return false;
    }

    try {
        // Método 1: Usar getCurrentViewRecords para obter linhas visíveis
        if (ganttChart.treeGrid && ganttChart.treeGrid.getCurrentViewRecords) {
            var viewRecords = ganttChart.treeGrid.getCurrentViewRecords();
            if (viewRecords && viewRecords.length > 0) {
                var isLast = currentSelectedRowIndex === viewRecords.length - 1;
                console.log('isLastVisibleRow (método 1): linha', currentSelectedRowIndex, 'de', viewRecords.length, '= última?', isLast);
                return isLast;
            }
        }

        // Método 2: Contar linhas DOM visíveis
        var visibleRows = document.querySelectorAll('.e-treegrid .e-row:not(.e-hide)');
        if (visibleRows.length > 0) {
            var isLast = currentSelectedRowIndex === visibleRows.length - 1;
            console.log('isLastVisibleRow (método 2): linha', currentSelectedRowIndex, 'de', visibleRows.length, '= última?', isLast);
            return isLast;
        }

        // Método 3: Fallback - usar flatData
        if (ganttChart.flatData) {
            var isLast = currentSelectedRowIndex === ganttChart.flatData.length - 1;
            console.log('isLastVisibleRow (método 3): linha', currentSelectedRowIndex, 'de', ganttChart.flatData.length, '= última?', isLast);
            return isLast;
        }

        // Método 4: Fallback final - usar dataSource
        if (ganttChart.dataSource) {
            var isLast = currentSelectedRowIndex === ganttChart.dataSource.length - 1;
            console.log('isLastVisibleRow (método 4): linha', currentSelectedRowIndex, 'de', ganttChart.dataSource.length, '= última?', isLast);
            return isLast;
        }

    } catch (error) {
        console.log('Erro ao verificar última linha:', error);
    }

    console.log('isLastVisibleRow: nenhum método funcionou');
    return false;
}

// Função para criar nova tarefa em modo de edição
function createNewTaskInEdit() {
    if (!ganttChart) {
        console.log('Gantt Chart não disponível');
        return;
    }

    try {
        // Obter o próximo TaskID disponível
        var nextTaskId = 1;
        if (ganttChart.flatData && ganttChart.flatData.length > 0) {
            var maxId = Math.max.apply(Math, ganttChart.flatData.map(function(item) { return item.TaskID; }));
            nextTaskId = maxId + 1;
        } else if (ganttChart.dataSource && ganttChart.dataSource.length > 0) {
            var maxId = Math.max.apply(Math, ganttChart.dataSource.map(function(item) { return item.TaskID; }));
            nextTaskId = maxId + 1;
        }

        if (indentBtn) {
            // Sempre manter visível
            indentBtn.style.display = 'inline-block';
            indentBtn.style.visibility = 'visible';
            
            const selectedRecords = ganttChart.getSelectedRecords();
            const canIndent = selectedRecords.length > 0 && ganttChart.selectedRowIndex > 0;
            
            if (canIndent) {
                // Habilitar Indent
                indentBtn.disabled = false;
                indentBtn.classList.remove('e-disabled');
                indentBtn.style.opacity = '1';
                indentBtn.style.cursor = 'pointer';
                indentBtn.style.pointerEvents = 'auto';
            } else {
                // Desabilitar Indent
                indentBtn.disabled = true;
                indentBtn.classList.add('e-disabled');
                indentBtn.style.opacity = '0.5';
                indentBtn.style.cursor = 'not-allowed';
                indentBtn.style.pointerEvents = 'none';
            }
        }
        
        if (outdentBtn) {
            // Sempre manter visível
            outdentBtn.style.display = 'inline-block';
            outdentBtn.style.visibility = 'visible';
            
            const selectedRecords = ganttChart.getSelectedRecords();
            const canOutdent = selectedRecords.length > 0 && selectedRecords[0].parentItem;
            
            if (canOutdent) {
                // Habilitar Outdent
                outdentBtn.disabled = false;
                outdentBtn.classList.remove('e-disabled');
                outdentBtn.style.opacity = '1';
                outdentBtn.style.cursor = 'pointer';
                outdentBtn.style.pointerEvents = 'auto';
            } else {
                // Desabilitar Outdent
                outdentBtn.disabled = true;
                outdentBtn.classList.add('e-disabled');
                outdentBtn.style.opacity = '0.5';
                outdentBtn.style.cursor = 'not-allowed';
                outdentBtn.style.pointerEvents = 'none';
            }
        } catch (dateError) {
            console.log('Erro no cálculo da data:', dateError);
            startDate = new Date();
        }

        // Criar nova tarefa com dados básicos
        var newTask = {
            TaskID: nextTaskId,
            TaskName: 'Nova Tarefa',
            StartDate: startDate,
            Duration: 1,
            Progress: 0,
            Predecessor: ''
        };

        console.log('Criando nova tarefa:', newTask);

        // Configurar flags para o evento actionComplete
        window.shouldEditNewTask = true;
        window.newTaskIdToEdit = nextTaskId;

        // Usar o método oficial do Gantt para adicionar tarefa
        ganttChart.addRecord(newTask);

    } catch (error) {
        console.log('Erro ao criar nova tarefa:', error);
        window.shouldEditNewTask = false;
    }
}

// Função para configurar evento Enter para edição e garantir duplo clique
function setupEnterKeyEditing() {
    setTimeout(function() {
        if (ganttChart && ganttChart.treeGrid) {
            // Garantir que o TreeGrid permite edição
            ganttChart.treeGrid.editSettings = {
                allowEditing: true,
                allowAdding: true,
                allowDeleting: true,
                mode: 'Cell'
            };

            // Garantir que colunas são editáveis
            if (ganttChart.treeGrid.columns) {
                ganttChart.treeGrid.columns.forEach(function(col) {
                    if (col.field === 'TaskName' || col.field === 'Duration' || col.field === 'StartDate' || col.field === 'EndDate' || col.field === 'Progress' || col.field === 'Predecessor') {
                        col.allowEditing = true;
                    }
                });
            }

            console.log('TreeGrid configurado para edição');
        }

        // Adicionar event listener ao documento para capturar todas as teclas
        document.addEventListener('keydown', function(event) {
            console.log('Tecla detectada:', event.key, 'Ctrl:', event.ctrlKey, 'Shift:', event.shiftKey, 'Alt:', event.altKey);
            
            // Verificar se não está em modo de edição
            var isInEditMode = document.querySelector('.e-treegrid .e-editedrow, .e-treegrid .e-editedbatchcell');
            if (isInEditMode) {
                console.log('Em modo de edição, ignorando atalhos');
                return;
            }

            // Verificar se o foco está no Gantt ou se há linha selecionada
            var ganttElement = document.getElementById('Gantt');
            var ganttHasFocus = ganttElement && (ganttElement.contains(document.activeElement) || currentSelectedRowIndex >= 0);
            
            if (!ganttHasFocus) {
                console.log('Gantt não tem foco, ignorando atalhos');
                return;
            }

            // FUNCIONALIDADE OUTDENT: Ctrl + Shift + Seta Esquerda
            if (event.ctrlKey && event.shiftKey && (event.key === 'ArrowLeft' || event.keyCode === 37)) {
                console.log('🎯 Ctrl + Shift + ← detectado! Linha atual:', currentSelectedRowIndex);
                event.preventDefault();
                event.stopPropagation();
                
                if (currentSelectedRowIndex >= 0) {
                    outdentTask(currentSelectedRowIndex);
                } else {
                    console.log('Nenhuma linha selecionada para outdent');
                }
                return;
            }

            // FUNCIONALIDADE INDENT: Ctrl + Shift + Seta Direita  
            if (event.ctrlKey && event.shiftKey && (event.key === 'ArrowRight' || event.keyCode === 39)) {
                console.log('🎯 Ctrl + Shift + → detectado! Linha atual:', currentSelectedRowIndex);
                event.preventDefault();
                event.stopPropagation();
                
                if (currentSelectedRowIndex > 0) {
                    moveTaskAsSubtask(currentSelectedRowIndex);
                } else {
                    console.log('Não é possível mover: primeira linha ou nenhuma linha selecionada');
                }
                return;
            }

            // TESTE ALTERNATIVO: Apenas Shift + Seta Esquerda
            if (event.shiftKey && !event.ctrlKey && (event.key === 'ArrowLeft' || event.keyCode === 37)) {
                console.log('🧪 TESTE: Shift + ← detectado (sem Ctrl). Linha atual:', currentSelectedRowIndex);
                event.preventDefault();
                event.stopPropagation();
                
                if (currentSelectedRowIndex >= 0) {
                    console.log('🧪 EXECUTANDO OUTDENT VIA TESTE...');
                    outdentTask(currentSelectedRowIndex);
                }
                return;
            }

            // Funcionalidade Enter para edição (apenas se Gantt tem foco)
            if (event.key === 'Enter' || event.keyCode === 13) {
                if (currentSelectedRowIndex >= 0) {
                    console.log('Enter detectado, iniciando edição da linha:', currentSelectedRowIndex);
                    event.preventDefault();
                    event.stopPropagation();

                    try {
                        if (ganttChart && ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                            ganttChart.treeGrid.editCell(currentSelectedRowIndex, 'TaskName');
                            console.log('Edição iniciada via Enter para linha:', currentSelectedRowIndex);
                            focusTaskNameField();
                        }
                    } catch (error) {
                        console.log('Erro ao iniciar edição:', error);
                    }
                }
                return;
            }

            // Funcionalidade seta para baixo - criar nova tarefa na última linha
            if (event.key === 'ArrowDown' || event.keyCode === 40) {
                console.log('Seta para baixo detectada. Linha atual:', currentSelectedRowIndex);

                var isLast = isLastVisibleRow();
                console.log('É última linha?', isLast);

                if (currentSelectedRowIndex >= 0 && isLast) {
                    event.preventDefault();
                    event.stopPropagation();

                    console.log('🎯 Última linha detectada, criando nova tarefa...');
                    createNewTaskInEdit();
                }
                return;
            }
        });

        // Event listener para clicks em linhas (manter no elemento Gantt)
        var ganttElement = document.getElementById('Gantt');
        if (ganttElement) {
            ganttElement.addEventListener('click', function(event) {
                var clickedRow = event.target.closest('.e-treegrid .e-row');
                if (clickedRow) {
                    var ariaRowIndex = clickedRow.getAttribute('aria-rowindex');
                    if (ariaRowIndex !== null) {
                        currentSelectedRowIndex = parseInt(ariaRowIndex);
                        console.log('Clique na linha:', currentSelectedRowIndex);
                    }
                }
            });

            // Garantir que o elemento Gantt pode receber foco
            ganttElement.setAttribute('tabindex', '0');
            ganttElement.style.outline = 'none';
            
            console.log('Event listeners configurados');
            console.log('Funcionalidade ativa: Pressione ↓ na última linha para criar nova tarefa');
        }
    }, 1000);
}

// Função para mover tarefa atual como subtarefa da tarefa anterior
function moveTaskAsSubtask(currentRowIndex) {
    if (!ganttChart || !ganttChart.flatData || currentRowIndex <= 0) {
        console.log('Não é possível mover: dados não disponíveis ou primeira linha');
        return;
    }

    try {
        // Obter a tarefa atual e a tarefa anterior
        var currentTask = ganttChart.flatData[currentRowIndex];
        var previousTask = ganttChart.flatData[currentRowIndex - 1];

        if (!currentTask || !previousTask) {
            console.log('Tarefas não encontradas');
            return;
        }

        console.log('Movendo tarefa:', currentTask.TaskName, 'como subtarefa de:', previousTask.TaskName);

        // Obter idioma atual para mensagens
        var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
        var msgs = getMessages(currentLanguage);

        // Usar o método nativo do Syncfusion para mover a tarefa
        // Primeiro, encontrar a tarefa pai no dataSource
        var parentTask = findTaskInDataSource(previousTask.TaskID, ganttChart.dataSource);
        
        if (!parentTask) {
            console.log('Tarefa pai não encontrada');
            return;
        }

        // Usar o método indent do Syncfusion para mover a tarefa como subtarefa
        if (ganttChart.indent) {
            // O método indent move a tarefa selecionada como subtarefa da anterior
            ganttChart.indent();
            
            console.log('✅ Tarefa movida como subtarefa usando método nativo');
            
        } else {
            // Fallback: método manual se indent não estiver disponível
            console.log('Método indent não disponível, usando método manual');
            moveTaskManually(currentTask, parentTask, currentLanguage);
        }

    } catch (error) {
        console.error('Erro geral ao mover tarefa como subtarefa:', error);
    }
}

// Função auxiliar para mover tarefa manualmente (fallback)
function moveTaskManually(currentTask, parentTask, currentLanguage) {
    try {
        // Criar uma cópia da tarefa atual
        var taskToMove = {
            TaskID: currentTask.TaskID,
            TaskName: currentTask.TaskName,
            StartDate: currentTask.StartDate,
            EndDate: currentTask.EndDate,
            Duration: currentTask.Duration,
            Progress: currentTask.Progress,
            Predecessor: currentTask.Predecessor
        };

        // Encontrar e remover a tarefa do dataSource original
        var removed = removeTaskFromDataSource(currentTask.TaskID, ganttChart.dataSource);
        
        if (removed) {
            // Inicializar subtasks se não existir
            if (!parentTask.subtasks) {
                parentTask.subtasks = [];
            }

            // Adicionar a tarefa como subtarefa
            parentTask.subtasks.push(taskToMove);

            // Refresh do gantt para aplicar mudanças
            ganttChart.refresh();

            // Aguardar refresh e expandir a tarefa pai
            setTimeout(function() {
                try {
                    // Expandir a tarefa pai para mostrar a nova subtarefa
                    if (ganttChart.expandByID) {
                        ganttChart.expandByID(parentTask.TaskID);
                    }

                    console.log('✅ Tarefa movida manualmente como subtarefa');
                    
                } catch (expandError) {
                    console.log('Erro ao expandir tarefa pai:', expandError);
                }
            }, 300);
        } else {
            console.log('Não foi possível remover a tarefa original');
        }

    } catch (error) {
        console.error('Erro no método manual:', error);
    }
}

// Função auxiliar para remover uma tarefa do dataSource
function removeTaskFromDataSource(taskId, dataSource) {
    if (!dataSource || !Array.isArray(dataSource)) {
        return false;
    }

    for (var i = 0; i < dataSource.length; i++) {
        var task = dataSource[i];
        
        // Verificar se é a tarefa a ser removida
        if (task.TaskID === taskId) {
            dataSource.splice(i, 1);
            return true;
        }
        
        // Buscar recursivamente nas subtarefas
        if (task.subtasks && task.subtasks.length > 0) {
            var removed = removeTaskFromDataSource(taskId, task.subtasks);
            if (removed) {
                return true;
            }
        }
    }
    
    return false;
}
// Função auxiliar para encontrar uma tarefa no dataSource por ID
function findTaskInDataSource(taskId, dataSource) {
    if (!dataSource || !Array.isArray(dataSource)) {
        return null;
    }

    for (var i = 0; i < dataSource.length; i++) {
        var task = dataSource[i];
        
        // Verificar se é a tarefa procurada
        if (task.TaskID === taskId) {
            return task;
        }
        
        // Buscar recursivamente nas subtarefas
        if (task.subtasks && task.subtasks.length > 0) {
            var found = findTaskInDataSource(taskId, task.subtasks);
            if (found) {
                return found;
            }
        }
    }
    
    return null;
}

// Função para outdent (mover subtarefa para nível pai)
function outdentTask(currentRowIndex) {
    if (!ganttChart || !ganttChart.flatData || currentRowIndex < 0) {
        console.log('Não é possível fazer outdent: dados não disponíveis');
        return;
    }

    try {
        // Usar o método nativo do Syncfusion para outdent
        if (ganttChart.outdent) {
            ganttChart.outdent();
            
            console.log('✅ Outdent executado usando método nativo');
            
        } else {
            console.log('Método outdent não disponível');
        }

    } catch (error) {
        console.error('Erro ao executar outdent:', error);
    }
}

// Adicionar o Gantt ao DOM
if (ganttChart) {
    try {
        ganttChart.appendTo('#Gantt');
        console.log('Gantt inicializado com sucesso');

        // Configurar foco no elemento Gantt
        var ganttElement = document.getElementById('Gantt');
        if (ganttElement) {
            ganttElement.setAttribute('tabindex', '0');
            ganttElement.style.outline = 'none';
        }

        // Configurar event listener para Enter
        setupEnterKeyEditing();

        // Garantir configurações de edição após inicialização
        setTimeout(function() {
            if (ganttChart && ganttChart.treeGrid) {
                // Forçar configurações de edição no TreeGrid
                if (ganttChart.treeGrid.editSettings) {
                    ganttChart.treeGrid.editSettings.allowEditing = true;
                    ganttChart.treeGrid.editSettings.mode = 'Cell';
                }

                // Garantir que todas as colunas editáveis estão configuradas
                if (ganttChart.columns) {
                    ganttChart.columns.forEach(function(col) {
                        if (col.field === 'TaskName' || col.field === 'Duration' || col.field === 'StartDate' || col.field === 'EndDate' || col.field === 'Progress' || col.field === 'Predecessor') {
                            col.allowEditing = true;
                        }
                    });
                }

                console.log('Configurações de edição aplicadas');
            }
            
            // Atualizar estado inicial dos botões
            setTimeout(function() {
                updateToolbarButtonStates();
                
                // Forçar visibilidade dos botões periodicamente
                setInterval(function() {
                    var indentButton = document.querySelector('#' + ganttChart.element.id + '_indent');
                    var outdentButton = document.querySelector('#' + ganttChart.element.id + '_outdent');
                    
                    if (indentButton && indentButton.style.display === 'none') {
                        indentButton.style.display = 'inline-block';
                        indentButton.style.visibility = 'visible';
                    }
                    
                    if (outdentButton && outdentButton.style.display === 'none') {
                        outdentButton.style.display = 'inline-block';
                        outdentButton.style.visibility = 'visible';
                    }
                }, 1000);
            }, 500);
        }, 1500);

    } catch (error) {
        console.error('Erro ao anexar Gantt ao DOM:', error);
    }
}

// Função de teste para criar nova tarefa manualmente (pode ser chamada no console)
window.testCreateNewTask = function() {
    console.log('Testando criação de nova tarefa...');
    createNewTaskInEdit();
};

// Configurar função dataBound
if (ganttChart) {
    ganttChart.dataBound = function() {
        try {
            if (!ganttChart.isInitialLoad) {
                ganttChart.isInitialLoad = true;

                // Garantir configurações de edição
                if (ganttChart.treeGrid) {
                    ganttChart.treeGrid.editSettings = ganttChart.treeGrid.editSettings || {};
                    ganttChart.treeGrid.editSettings.allowEditing = true;
                    ganttChart.treeGrid.editSettings.allowAdding = true;
                    ganttChart.treeGrid.editSettings.mode = 'Cell';
                }

                // Garantir que colunas são editáveis
                if (ganttChart.columns) {
                    ganttChart.columns.forEach(function(col) {
                        if (col.field === 'TaskName' || col.field === 'Duration' || col.field === 'StartDate' || col.field === 'EndDate' || col.field === 'Progress' || col.field === 'Predecessor') {
                            col.allowEditing = true;
                        }
                    });
                }

                // Inicializar textos dos botões com idioma padrão
                var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
                if (typeof updateButtonTexts !== 'undefined') {
                    updateButtonTexts(currentLanguage);
                }

                setTimeout(function() {
                    if (ganttChart && ganttChart.fitToProject) {
                        ganttChart.fitToProject();
                    }
                }, 100);

                console.log('Gantt carregado - edição habilitada');
                console.log('Funcionalidades ativas:');
                console.log('- Pressione ↓ na última linha para criar nova tarefa');
                console.log('- Pressione Ctrl+Shift+→ para mover tarefa como subtarefa da anterior');
                console.log('- Pressione Ctrl+Shift+← para mover subtarefa para nível pai (outdent)');
            }
        } catch (error) {
            console.error('Erro na função dataBound:', error);
        }
    };
}