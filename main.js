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
        child: 'subtasks',
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
        mode: 'Cell'
    },
    toolbar: ['Update', 'Delete', 'Cancel', 'ExpandAll', 'CollapseAll', 'ExcelExport', 'PdfExport', 'Search', 'ZoomIn', 'ZoomOut', 'ZoomToFit'],
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

// Função de debug para diagnóstico
function debugRowInfo() {
    console.log('=== DEBUG INFO ===');
    console.log('currentSelectedRowIndex:', currentSelectedRowIndex);

    var activeRows = document.querySelectorAll('.e-treegrid .e-row.e-active, .e-treegrid .e-row[aria-selected="true"]');
    console.log('Linhas ativas no DOM:', activeRows.length);

    activeRows.forEach(function(row, index) {
        var ariaRowIndex = row.getAttribute('aria-rowindex');
        console.log('Linha ativa', index, '- aria-rowindex:', ariaRowIndex);
    });

    if (ganttChart && ganttChart.getSelectedRowIndexes) {
        var selectedIndexes = ganttChart.getSelectedRowIndexes();
        console.log('Índices selecionados (API Gantt):', selectedIndexes);
    }

    if (ganttChart && ganttChart.dataSource) {
        console.log('Total de linhas no dataSource:', ganttChart.dataSource.length);
        ganttChart.dataSource.forEach(function(item, index) {
            console.log('Linha', index, '- TaskID:', item.TaskID, 'TaskName:', item.TaskName);
        });
    }
    console.log('===================');
}

// Função utilitária para focar no campo TaskName após iniciar edição
function focusTaskNameField() {
    setTimeout(function() {
        try {
            var taskNameInput = document.querySelector(
                '.e-treegrid .e-editedbatchcell input, ' +
                '.e-treegrid .e-inline-edit input[aria-label*="Task"], ' +
                '.e-treegrid .e-inline-edit input[name="TaskName"], ' +
                '.e-treegrid .e-editedrow input, ' +
                '.e-treegrid td[aria-describedby*="TaskName"] input, ' +
                'input[aria-label*="Task Name"]'
            );
            if (taskNameInput) {
                taskNameInput.focus();
                taskNameInput.select();
                console.log('Campo TaskName focado após Enter');
            }
        } catch (error) {
            console.log('Não foi possível focar TaskName:', error);
        }
    }, 100);
}

// Função para configurar evento Enter para edição
function setupEnterKeyEditing() {
    setTimeout(function() {
        var ganttElement = document.getElementById('Gantt');
        if (ganttElement) {
            ganttElement.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.keyCode === 13) {
                    // Verificar se já está em modo de edição
                    var isInEditMode = document.querySelector('.e-treegrid .e-editedrow, .e-treegrid .e-editedbatchcell');
                    if (isInEditMode) {
                        return; // Deixar comportamento padrão se já editando
                    }

                    // Verificar se há linha selecionada
                    if (currentSelectedRowIndex >= 0) {
                        event.preventDefault();
                        event.stopPropagation();

                        // Iniciar edição usando treeGrid.editCell
                        try {
                            if (ganttChart && ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                                ganttChart.treeGrid.editCell(currentSelectedRowIndex, 'TaskName');
                                console.log('Edição iniciada via Enter para linha:', currentSelectedRowIndex);

                                // Focar no campo após um pequeno delay
                                setTimeout(function() {
                                    var input = document.querySelector('.e-treegrid .e-rowcell input[name="TaskName"], .e-treegrid .e-rowcell input');
                                    if (input) {
                                        input.focus();
                                        input.select();
                                    }
                                }, 100);
                            }
                        } catch (error) {
                            console.log('Erro ao iniciar edição:', error);
                        }
                    }
                }
            });

            // Event listener para clicks em linhas
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

            console.log('Event listeners configurados para Enter');
        }
    }, 500);
}

// Função global para debug manual (pode ser chamada no console)
window.debugGanttSelection = function() {
    console.log('🔍 DIAGNÓSTICO MANUAL GANTT SELECTION');
    debugRowInfo();

    // Informações adicionais
    var focusedElement = document.activeElement;
    console.log('Elemento com foco:', focusedElement.tagName, focusedElement.className);

    var clickedRows = document.querySelectorAll('.e-treegrid .e-row:hover, .e-treegrid .e-row.e-active');
    console.log('Linhas com hover/active:', clickedRows.length);

    if (ganttChart) {
        console.log('Gantt Chart carregado:', !!ganttChart);
        console.log('DataSource disponível:', !!ganttChart.dataSource);
        console.log('TreeGrid disponível:', !!ganttChart.treeGrid);
    }
};

// Função para teste manual de edição (pode ser chamada no console)
window.testEditCurrentRow = function() {
    console.log('🧪 TESTE MANUAL DE EDIÇÃO');
    console.log('Linha visual selecionada:', currentSelectedRowIndex);

    if (currentSelectedRowIndex >= 0) {
        // Usar novo mapeamento hierárquico
        var taskData = getTaskDataFromVisualRow(currentSelectedRowIndex);

        if (taskData) {
            console.log('✅ Dados encontrados:', taskData.TaskName, '(ID:', taskData.TaskID + ')');

            try {
                if (ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                    ganttChart.treeGrid.editCell(currentSelectedRowIndex, 'TaskName');
                    console.log('✅ Edição manual iniciada via treeGrid.editCell!');
                    focusTaskNameField();
                } else if (ganttChart.startEdit) {
                    ganttChart.startEdit(taskData.TaskID);
                    console.log('✅ Edição manual iniciada via startEdit!');
                    focusTaskNameField();
                } else {
                    console.log('❌ Nenhum método de edição disponível');
                }
            } catch (error) {
                console.log('❌ Erro na edição manual:', error);
            }
        } else {
            console.log('❌ Não foi possível mapear linha visual para dados');
            console.log('🔧 Tentando edição direta...');

            try {
                if (ganttChart && ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                    ganttChart.treeGrid.editCell(currentSelectedRowIndex, 'TaskName');
                    console.log('✅ Edição direta bem-sucedida!');
                    focusTaskNameField();
                }
            } catch (error) {
                console.log('❌ Erro na edição direta:', error);
            }
        }
    } else {
        console.log('❌ Nenhuma linha selecionada');
        console.log('📋 Clique em uma linha primeiro ou use: currentSelectedRowIndex = 0');
    }
};

// Função para sair do modo de edição forçadamente (pode ser chamada no console)
window.forceExitEditMode = function() {
    console.log('🚫 FORÇANDO SAÍDA DO MODO DE EDIÇÃO');

    try {
        // Cancelar edição no TreeGrid
        if (ganttChart && ganttChart.treeGrid && ganttChart.treeGrid.cancelEdit) {
            ganttChart.treeGrid.cancelEdit();
            console.log('✅ TreeGrid.cancelEdit executado');
        }

        // Cancelar edição no Gantt
        if (ganttChart && ganttChart.cancelEdit) {
            ganttChart.cancelEdit();
            console.log('✅ Gantt.cancelEdit executado');
        }

        // Remover elementos de edição do DOM
        var editElements = document.querySelectorAll('.e-treegrid .e-editedrow, .e-treegrid .e-editedbatchcell');
        editElements.forEach(function(el) {
            el.classList.remove('e-editedrow', 'e-editedbatchcell');
        });

        console.log('✅ Limpeza do DOM realizada');

    } catch (error) {
        console.log('❌ Erro ao forçar saída:', error);
    }
};

// Função para verificar estado de edição detalhadamente
window.checkEditState = function() {
    console.log('🔍 VERIFICAÇÃO COMPLETA DO ESTADO DE EDIÇÃO');

    // Verificar elementos de edição
    var editedRows = document.querySelectorAll('.e-treegrid .e-editedrow');
    var editedCells = document.querySelectorAll('.e-treegrid .e-editedbatchcell');
    var inputsInCells = document.querySelectorAll('.e-treegrid .e-rowcell input, .e-treegrid .e-rowcell textarea');
    var allInputs = document.querySelectorAll('.e-treegrid input, .e-treegrid textarea');

    console.log('📊 CONTADORES:');
    console.log('- Linhas editadas (.e-editedrow):', editedRows.length);
    console.log('- Células editadas (.e-editedbatchcell):', editedCells.length);
    console.log('- Inputs em células:', inputsInCells.length);
    console.log('- Total de inputs:', allInputs.length);

    console.log('📋 DETALHES DOS INPUTS:');
    allInputs.forEach(function(input, index) {
        console.log('Input', index, ':', {
            id: input.id,
            className: input.className,
            type: input.type,
            placeholder: input.placeholder,
            isInCell: !!input.closest('.e-rowcell')
        });
    });

    // Verificar estado do Gantt
    if (ganttChart && ganttChart.treeGrid) {
        console.log('📈 ESTADO DO TREEGRID:');
        console.log('- TreeGrid disponível:', !!ganttChart.treeGrid);
        console.log('- isEdit (se disponível):', ganttChart.treeGrid.isEdit);
    }
};

// Função para inspecionar propriedades do Gantt
window.inspectGanttProperties = function() {
    console.log('🔍 INSPEÇÃO COMPLETA DO GANTT CHART');

    if (!ganttChart) {
        console.log('❌ ganttChart não está disponível');
        return;
    }

    console.log('📋 PROPRIEDADES PRINCIPAIS:');
    var mainProps = ['dataSource', 'treeGrid', 'flatData', 'taskFields', 'columns'];
    mainProps.forEach(function(prop) {
        var value = ganttChart[prop];
        console.log('- ' + prop + ':', !!value, typeof value);
        if (Array.isArray(value)) {
            console.log('  └── length:', value.length);
            if (value.length > 0) {
                console.log('  └── primeiro item:', value[0]);
            }
        }
    });

    console.log('📋 MÉTODOS RELEVANTES:');
    var methods = ['getCurrentViewRecords', 'getSelectedRowIndexes', 'startEdit', 'editCell'];
    methods.forEach(function(method) {
        console.log('- ' + method + ':', typeof ganttChart[method]);
    });

    if (ganttChart.treeGrid) {
        console.log('📋 TREEGRID PROPRIEDADES:');
        var treeProps = ['dataSource', 'editCell', 'startEdit', 'isEdit'];
        treeProps.forEach(function(prop) {
            var value = ganttChart.treeGrid[prop];
            console.log('- treeGrid.' + prop + ':', !!value, typeof value);
            if (Array.isArray(value)) {
                console.log('  └── length:', value.length);
            }
        });
    }

    // Informações do DOM
    var domRows = document.querySelectorAll('.e-treegrid .e-row');
    console.log('📋 INFORMAÇÕES DO DOM:');
    console.log('- Linhas renderizadas:', domRows.length);

    domRows.forEach(function(row, index) {
        if (index < 5) { // Mostrar apenas as primeiras 5 linhas
            var cells = row.querySelectorAll('.e-rowcell');
            var rowText = '';
            if (cells.length > 1) {
                rowText = cells[1].textContent.trim(); // TaskName
            }
            console.log('  └── Linha ' + index + ':', rowText);
        }
    });
};

// Função de reset completo (último recurso)
window.resetGanttState = function() {
    console.log('🔄 RESET COMPLETO DO ESTADO DO GANTT');

    try {
        // Forçar saída do modo de edição
        forceExitEditMode();

        // Limpar seleção
        if (ganttChart && ganttChart.clearSelection) {
            ganttChart.clearSelection();
        }

        // Resetar variável de linha selecionada
        currentSelectedRowIndex = -1;

        // Refresh do componente
        if (ganttChart && ganttChart.refresh) {
            ganttChart.refresh();
        }

        console.log('✅ Reset completo realizado');
        console.log('📋 Agora clique em uma linha e tente Enter novamente');

    } catch (error) {
        console.log('❌ Erro no reset:', error);
    }
};

// Função de debug rápido (atalho)
window.debugQuick = function() {
    console.log('⚡ DEBUG RÁPIDO');
    console.log('currentSelectedRowIndex:', currentSelectedRowIndex);

    if (ganttChart) {
        var methods = [
            { name: 'dataSource', value: ganttChart.dataSource },
            { name: 'treeGrid.dataSource', value: ganttChart.treeGrid?.dataSource },
            { name: 'flatData', value: ganttChart.flatData }
        ];

        methods.forEach(function(method) {
            if (method.value) {
                console.log('✅', method.name + ':', method.value.length, 'itens');
                if (method.value.length > 0) {
                    console.log('  └── Primeira tarefa:', method.value[0].TaskName);
                }
            } else {
                console.log('❌', method.name + ':', 'não disponível');
            }
        });
    }

    var domRows = document.querySelectorAll('.e-treegrid .e-row');
    console.log('📋 Linhas no DOM:', domRows.length);

    console.log('🔧 Para testar edição: testEditCurrentRow()');
    console.log('🎯 Para testar linha única: testSingleRowEdit()');
    console.log('🔍 Para debug completo: inspectGanttProperties()');
};

// Função para configurar automaticamente linha única para edição
function setupSingleRowForEdit() {
    setTimeout(function() {
        var domRows = document.querySelectorAll('.e-treegrid .e-row');
        console.log('🔍 SETUP LINHA ÚNICA: Verificando cenário...');
        console.log('- Linhas no DOM:', domRows.length);
        console.log('- currentSelectedRowIndex:', currentSelectedRowIndex);

        if (domRows.length === 1 && currentSelectedRowIndex < 0) {
            console.log('🎯 AUTO-SETUP: Configurando linha única para edição');
            currentSelectedRowIndex = 0;

            // Garantir que a linha está visualmente selecionada
            var firstRow = domRows[0];
            if (firstRow && !firstRow.classList.contains('e-active')) {
                // Simular clique para garantir seleção
                try {
                    firstRow.click();
                    console.log('✅ AUTO-SETUP: Linha única clicada para seleção');
                } catch (error) {
                    console.log('⚠️ AUTO-SETUP: Erro ao clicar na linha:', error);
                }
            }
        }
    }, 1500); // Timeout maior para garantir que tudo esteja carregado
}

// Função específica para testar edição de linha única
window.testSingleRowEdit = function() {
    console.log('🎯 TESTE ESPECÍFICO PARA LINHA ÚNICA');

    var domRows = document.querySelectorAll('.e-treegrid .e-row');
    console.log('Linhas no DOM:', domRows.length);

    if (domRows.length === 0) {
        console.log('❌ Nenhuma linha encontrada no DOM');
        return;
    }

    // Forçar seleção da primeira linha
    var targetRowIndex = 0;
    currentSelectedRowIndex = 0;
    console.log('🔧 Forçando seleção da linha 0');

    // Tentar diferentes métodos de edição
    var methods = [
        {
            name: 'treeGrid.editCell',
            func: function() {
                if (ganttChart && ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                    ganttChart.treeGrid.editCell(0, 'TaskName');
                    return true;
                }
                return false;
            }
        },
        {
            name: 'startEdit com ID 1',
            func: function() {
                if (ganttChart && ganttChart.startEdit) {
                    ganttChart.startEdit(1);
                    return true;
                }
                return false;
            }
        },
        {
            name: 'beginEdit com dados',
            func: function() {
                if (ganttChart && ganttChart.beginEdit) {
                    var taskData = { TaskID: 1, TaskName: 'Nova Tarefa' };
                    ganttChart.beginEdit(taskData);
                    return true;
                }
                return false;
            }
        }
    ];

    for (var i = 0; i < methods.length; i++) {
        var method = methods[i];
        console.log('🧪 Testando método:', method.name);

        try {
            if (method.func()) {
                console.log('✅ SUCESSO com método:', method.name);
                focusTaskNameField();
                return;
            } else {
                console.log('❌ Método não disponível:', method.name);
            }
        } catch (error) {
            console.log('❌ Erro no método', method.name + ':', error);
        }
    }

    console.log('💥 Todos os métodos falharam');
};

// Função para verificar configurações que podem estar bloqueando edição
window.checkEditConfiguration = function() {
    console.log('🔍 VERIFICANDO CONFIGURAÇÕES DE EDIÇÃO');

    if (!ganttChart) {
        console.log('❌ ganttChart não disponível');
        return;
    }

    console.log('📋 CONFIGURAÇÕES ATUAIS:');

    // Verificar editSettings
    if (ganttChart.editSettings) {
        console.log('✅ editSettings encontrado:');
        console.log('  - allowEditing:', ganttChart.editSettings.allowEditing);
        console.log('  - allowAdding:', ganttChart.editSettings.allowAdding);
        console.log('  - mode:', ganttChart.editSettings.mode);
        console.log('  - allowTaskbarEditing:', ganttChart.editSettings.allowTaskbarEditing);
    } else {
        console.log('❌ editSettings não encontrado');
    }

    // Verificar se TreeGrid tem configurações de edição
    if (ganttChart.treeGrid && ganttChart.treeGrid.editSettings) {
        console.log('✅ treeGrid.editSettings encontrado:');
        console.log('  - allowEditing:', ganttChart.treeGrid.editSettings.allowEditing);
        console.log('  - mode:', ganttChart.treeGrid.editSettings.mode);
    } else {
        console.log('⚠️ treeGrid.editSettings não encontrado');
    }

    // Verificar propriedades de edição
    var editProps = ['isEdit', 'allowEditing', 'readonly'];
    editProps.forEach(function(prop) {
        if (ganttChart.hasOwnProperty(prop)) {
            console.log('📌 ganttChart.' + prop + ':', ganttChart[prop]);
        }
        if (ganttChart.treeGrid && ganttChart.treeGrid.hasOwnProperty(prop)) {
            console.log('��� treeGrid.' + prop + ':', ganttChart.treeGrid[prop]);
        }
    });

    // Verificar colunas editáveis
    if (ganttChart.columns) {
        console.log('📋 COLUNAS EDITÁVEIS:');
        ganttChart.columns.forEach(function(col, index) {
            console.log('  - Coluna ' + index + ' (' + col.field + '): allowEditing =', col.allowEditing);
        });
    }

    console.log('🔧 Para corrigir problemas, tente: fixEditConfiguration()');
};

// Função para corrigir configurações de edição
window.fixEditConfiguration = function() {
    console.log('🔧 CORRIGINDO CONFIGURAÇÕES DE EDIÇÃO');

    if (!ganttChart) {
        console.log('❌ ganttChart não disponível');
        return;
    }

    try {
        // Corrigir editSettings do Gantt
        if (ganttChart.editSettings) {
            ganttChart.editSettings.allowEditing = true;
            ganttChart.editSettings.allowAdding = true;
            ganttChart.editSettings.mode = 'Cell';
            console.log('✅ editSettings do Gantt corrigido');
        }

        // Corrigir editSettings do TreeGrid
        if (ganttChart.treeGrid) {
            if (!ganttChart.treeGrid.editSettings) {
                ganttChart.treeGrid.editSettings = {};
            }
            ganttChart.treeGrid.editSettings.allowEditing = true;
            ganttChart.treeGrid.editSettings.allowAdding = true;
            ganttChart.treeGrid.editSettings.mode = 'Cell';
            console.log('✅ editSettings do TreeGrid corrigido');
        }

        // Garantir que colunas são editáveis
        if (ganttChart.columns) {
            ganttChart.columns.forEach(function(col) {
                if (col.field === 'TaskName' || col.field === 'Duration' || col.field === 'StartDate') {
                    col.allowEditing = true;
                }
            });
            console.log('✅ Colunas marcadas como editáveis');
        }

        // Refresh do componente
        if (ganttChart.refresh) {
            ganttChart.refresh();
            console.log('✅ Componente atualizado');
        }

        console.log('🎉 Configurações corrigidas! Tente editar novamente.');

    } catch (error) {
        console.log('❌ Erro ao corrigir configurações:', error);
    }
};

// Função de diagnóstico e correção automática completa
window.diagnoseAndFix = function() {
    console.log('🩺 DIAGNÓSTICO E CORREÇÃO AUTOMÁTICA');
    console.log('=====================================');

    // 1. Verificar configurações
    console.log('1️⃣ Verificando configurações...');
    checkEditConfiguration();

    // 2. Corrigir configurações
    console.log('2️⃣ Corrigindo configurações...');
    fixEditConfiguration();

    // 3. Configurar linha única se necessário
    console.log('3️⃣ Configurando linha única...');
    var domRows = document.querySelectorAll('.e-treegrid .e-row');
    if (domRows.length === 1) {
        forceSingleRowSetup();
    }

    // 4. Tentar edição
    setTimeout(function() {
        console.log('4️⃣ Testando edição...');
        if (currentSelectedRowIndex >= 0) {
            forceEditRow(currentSelectedRowIndex);
        } else {
            forceEditRow(0);
        }
    }, 1000);

    console.log('=====================================');
    console.log('🎯 Diagnóstico completo! Aguarde 1 segundo...');
};

// Função para restaurar funcionalidade de duplo clique nativa
window.restoreDoubleClickEdit = function() {
    console.log('🔄 RESTAURANDO FUNCIONALIDADE DE DUPLO CLIQUE');

    if (!ganttChart) {
        console.log('❌ ganttChart não disponível');
        return;
    }

    try {
        // Restaurar configurações originais que podem ter sido alteradas
        if (ganttChart.editSettings) {
            ganttChart.editSettings.allowEditing = true;
            ganttChart.editSettings.mode = 'Cell';
            console.log('✅ Configurações de edição restauradas');
        }

        // Garantir que TreeGrid permite edição por duplo clique
        if (ganttChart.treeGrid) {
            if (ganttChart.treeGrid.editSettings) {
                ganttChart.treeGrid.editSettings.allowEditing = true;
                ganttChart.treeGrid.editSettings.mode = 'Cell';
                console.log('✅ TreeGrid configurado para edição por duplo clique');
            }

            // Verificar se o evento de duplo clique está funcionando
            if (ganttChart.treeGrid.element) {
                var testElement = ganttChart.treeGrid.element.querySelector('.e-rowcell');
                if (testElement) {
                    console.log('✅ Elementos editáveis encontrados');
                }
            }
        }

        // Refresh do componente para aplicar mudanças
        if (ganttChart.refresh) {
            ganttChart.refresh();
            console.log('✅ Componente atualizado');
        }

        console.log('🎉 Funcionalidade de duplo clique restaurada!');
        console.log('📋 Teste: duplo clique em qualquer célula TaskName');

    } catch (error) {
        console.log('❌ Erro ao restaurar duplo clique:', error);
    }
};

// Função para mapear linha visual para dados corretos
window.getTaskDataFromVisualRow = function(visualRowIndex) {
    console.log('🔍 MAPEANDO LINHA VISUAL:', visualRowIndex);

    if (!ganttChart) {
        console.log('❌ ganttChart não disponível');
        return null;
    }

    var taskData = null;

    // Método 1: flatData (melhor para hierarquia)
    if (ganttChart.flatData && visualRowIndex < ganttChart.flatData.length) {
        taskData = ganttChart.flatData[visualRowIndex];
        console.log('✅ Método 1 - flatData:', taskData.TaskName);
        return taskData;
    }

    // Método 2: treeGrid getCurrentViewRecords
    if (ganttChart.treeGrid && ganttChart.treeGrid.getCurrentViewRecords) {
        try {
            var viewRecords = ganttChart.treeGrid.getCurrentViewRecords();
            if (viewRecords && visualRowIndex < viewRecords.length) {
                taskData = viewRecords[visualRowIndex];
                console.log('✅ Método 2 - getCurrentViewRecords:', taskData.TaskName);
                return taskData;
            }
        } catch (error) {
            console.log('⚠️ Erro no método getCurrentViewRecords:', error);
        }
    }

    // Método 3: mapear por nome via DOM
    var domRows = document.querySelectorAll('.e-treegrid .e-row');
    if (visualRowIndex < domRows.length) {
        var targetRow = domRows[visualRowIndex];
        var taskNameCell = targetRow.querySelector('.e-treecell');
        if (taskNameCell) {
            var taskNameFromDOM = taskNameCell.textContent.trim();
            console.log('📋 Nome da tarefa do DOM:', taskNameFromDOM);

            // Buscar nos dados por nome
            if (ganttChart.flatData) {
                taskData = ganttChart.flatData.find(function(item) {
                    return item.TaskName === taskNameFromDOM;
                });
                if (taskData) {
                    console.log('✅ Método 3 - Encontrado por nome:', taskData.TaskID);
                    return taskData;
                }
            }
        }
    }

    console.log('❌ Não foi possível mapear linha visual para dados');
    return null;
};

// Função de recovery completa para restaurar funcionalidade
window.fullRecovery = function() {
    console.log('🚑 RECOVERY COMPLETA DO GANTT');
    console.log('============================');

    try {
        // 1. Restaurar duplo clique
        console.log('1️⃣ Restaurando duplo clique...');
        restoreDoubleClickEdit();

        // 2. Resetar estado do Gantt
        console.log('2️⃣ Resetando estado...');
        resetGanttState();

        // 3. Reconfigurar seleção
        console.log('3️⃣ Reconfigurando seleção...');
        currentSelectedRowIndex = -1;

        // 4. Aguardar e testar
        setTimeout(function() {
            console.log('4️⃣ Testando funcionalidade...');

            // Testar duplo clique na primeira linha
            var firstRow = document.querySelector('.e-treegrid .e-row');
            if (firstRow) {
                var taskNameCell = firstRow.querySelector('.e-rowcell:nth-child(2)');
                if (taskNameCell) {
                    console.log('📋 Primeira linha encontrada:', taskNameCell.textContent.trim());
                    console.log('🔧 Tente duplo clique na célula TaskName da primeira linha');
                } else {
                    console.log('⚠️ Célula TaskName não encontrada');
                }
            } else {
                console.log('⚠️ Nenhuma linha encontrada');
            }

            console.log('============================');
            console.log('🎉 RECOVERY COMPLETA!');
            console.log('📋 Agora tente:');
            console.log('  - Duplo clique em qualquer célula TaskName');
            console.log('  - Ou clique + Enter');
            console.log('  - Ou testEditCurrentRow()');

        }, 2000);

    } catch (error) {
        console.log('❌ Erro na recovery:', error);
    }
};

// Função de teste rápido para verificar se tudo está funcionando
window.quickTest = function() {
    console.log('⚡ TESTE RÁPIDO DE FUNCIONALIDADE');
    console.log('================================');

    // 1. Verificar estrutura básica
    var domRows = document.querySelectorAll('.e-treegrid .e-row');
    var flatDataLength = ganttChart && ganttChart.flatData ? ganttChart.flatData.length : 0;

    console.log('📊 ESTRUTURA:');
    console.log('- Linhas no DOM:', domRows.length);
    console.log('- flatData itens:', flatDataLength);
    console.log('- currentSelectedRowIndex:', currentSelectedRowIndex);

    // 2. Testar mapeamento
    if (currentSelectedRowIndex >= 0) {
        console.log('🔍 TESTE DE MAPEAMENTO:');
        var taskData = getTaskDataFromVisualRow(currentSelectedRowIndex);
        if (taskData) {
            console.log('✅ Mapeamento OK:', taskData.TaskName);
        } else {
            console.log('❌ Mapeamento falhou');
        }
    }

    // 3. Verificar configurações de edição
    console.log('🔧 CONFIGURAÇÕES:');
    if (ganttChart && ganttChart.editSettings) {
        console.log('- allowEditing:', ganttChart.editSettings.allowEditing);
        console.log('- mode:', ganttChart.editSettings.mode);
    }

    if (ganttChart && ganttChart.treeGrid && ganttChart.treeGrid.editSettings) {
        console.log('- treeGrid.allowEditing:', ganttChart.treeGrid.editSettings.allowEditing);
    }

    console.log('================================');
    console.log('📋 INSTRUÇÕES DE TESTE:');
    console.log('1. Clique em qualquer linha');
    console.log('2. Pressione Enter OU duplo clique');
    console.log('3. Se não funcionar: fullRecovery()');
    console.log('================================');
};

// Função para forçar edição usando múltiplas abordagens
window.forceEditRow = function(rowIndex) {
    if (rowIndex === undefined) {
        rowIndex = currentSelectedRowIndex >= 0 ? currentSelectedRowIndex : 0;
    }

    console.log('🚀 FORÇANDO EDIÇÃO DA LINHA:', rowIndex);

    // Método 1: Simular duplo clique na célula TaskName
    var rows = document.querySelectorAll('.e-treegrid .e-row');
    if (rows[rowIndex]) {
        var cells = rows[rowIndex].querySelectorAll('.e-rowcell');
        if (cells.length > 1) { // TaskName é geralmente a segunda coluna
            var taskNameCell = cells[1];
            console.log('🔧 Método 1: Simulando duplo clique na célula TaskName...');

            try {
                // Simular duplo clique
                var dblClickEvent = new MouseEvent('dblclick', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                taskNameCell.dispatchEvent(dblClickEvent);
                console.log('✅ Duplo clique simulado');

                setTimeout(function() {
                    var isEditingAfterDblClick = document.querySelector('.e-treegrid .e-editedrow, .e-treegrid .e-editedbatchcell, .e-treegrid .e-rowcell input');
                    if (isEditingAfterDblClick) {
                        console.log('🎉 SUCESSO: Edição ativada via duplo clique!');
                        focusTaskNameField();
                        return;
                    } else {
                        console.log('❌ Duplo clique não ativou edição, tentando método 2...');
                        tryMethod2();
                    }
                }, 200);

            } catch (error) {
                console.log('❌ Erro no duplo clique:', error);
                tryMethod2();
            }
        } else {
            tryMethod2();
        }
    } else {
        console.log('❌ Linha não encontrada no DOM');
    }

    function tryMethod2() {
        console.log('🔧 Método 2: Forçar edição via API...');

        // Desabilitar temporariamente eventos que podem cancelar
        var originalActionBegin = ganttChart.actionBegin;
        ganttChart.actionBegin = function(args) {
            if (args.requestType === 'beginEdit') {
                console.log('✅ Permitindo beginEdit...');
            }
            // Chamar função original apenas se não for cancelamento
            if (originalActionBegin && args.requestType !== 'cancel') {
                originalActionBegin.call(ganttChart, args);
            }
        };

        try {
            if (ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                ganttChart.treeGrid.editCell(rowIndex, 'TaskName');
                console.log('✅ treeGrid.editCell executado com proteção');
            }
        } catch (error) {
            console.log('❌ Erro no método 2:', error);
        }

        // Restaurar eventos após um tempo
        setTimeout(function() {
            ganttChart.actionBegin = originalActionBegin;
            console.log('🔄 Eventos restaurados');
        }, 1000);
    }
};

// Função de conveniência para forçar setup de linha única
window.forceSingleRowSetup = function() {
    console.log('🔧 FORÇANDO SETUP DE LINHA ÚNICA');

    var domRows = document.querySelectorAll('.e-treegrid .e-row');
    console.log('Linhas encontradas:', domRows.length);

    if (domRows.length >= 1) {
        // Forçar seleção da primeira linha
        currentSelectedRowIndex = 0;

        var firstRow = domRows[0];
        if (firstRow) {
            // Marcar como ativa
            firstRow.classList.add('e-active');
            firstRow.setAttribute('aria-selected', 'true');

            // Remover ativo de outras linhas (se houver)
            domRows.forEach(function(row, index) {
                if (index !== 0) {
                    row.classList.remove('e-active');
                    row.setAttribute('aria-selected', 'false');
                }
            });

            console.log('✅ Linha 0 configurada como ativa');
            console.log('📋 Agora tente pressionar Enter para editar');
        }
    } else {
        console.log('❌ Nenhuma linha encontrada');
    }
};

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
            console.log('Foco configurado no elemento Gantt');
        }

        // Configurar event listener para Enter
        setupEnterKeyEditing();

        // Configurar linha única se necess��rio
        setupSingleRowForEdit();

        // Verificação adicional após mais tempo
        setTimeout(function() {
            var domRows = document.querySelectorAll('.e-treegrid .e-row');
            if (domRows.length === 1 && currentSelectedRowIndex < 0) {
                console.log('🔄 VERIFICAÇÃO TARDIA: Configurando linha única...');
                currentSelectedRowIndex = 0;

                // Tentar garantir que a linha esteja selecionada
                var firstRow = domRows[0];
                if (firstRow) {
                    firstRow.classList.add('e-active');
                    firstRow.setAttribute('aria-selected', 'true');
                    console.log('✅ VERIFICAÇÃO TARDIA: Linha única marcada como ativa');
                }
            }
        }, 3000);

        // Mostrar instruções de debug
        setTimeout(function() {
            console.log('🎯 GANTT CHART CARREGADO COM SUCESSO!');
            console.log('⚡ TESTE RÁPIDO: quickTest() - verificar se tudo funciona');
            console.log('🚑 RECOVERY: fullRecovery() - restaurar se algo quebrou');
            console.log('');
            console.log('💡 PRINCIPAIS FUNÇÕES:');
            console.log('- quickTest() - Teste completo de funcionalidade');
            console.log('- fullRecovery() - Recovery completa');
            console.log('- testEditCurrentRow() - Testar edição da linha selecionada');
            console.log('- getTaskDataFromVisualRow(index) - Mapear linha visual');
            console.log('- restoreDoubleClickEdit() - Restaurar duplo clique');
            console.log('');
            console.log('💡 OUTRAS FUNÇÕES:');
            console.log('- diagnoseAndFix() - Diagnóstico automático');
            console.log('- debugQuick() - Debug rápido');
            console.log('- forceEditRow(index) - Forçar edição');
            console.log('- checkEditConfiguration() - Verificar configurações');
            console.log('📋 COMO USAR: Clique em uma linha e pressione Enter para editar');
            console.log('🔧 HIERARQUIA: Sistema mapeia corretamente linhas expandidas');
            console.log('🆘 PROBLEMAS? Use: quickTest() depois fullRecovery()');
        }, 1000);

    } catch (error) {
        console.error('Erro ao anexar Gantt ao DOM:', error);
    }
}

// Configurar função dataBound
if (ganttChart) {
    ganttChart.dataBound = function() {
        try {
            if (!ganttChart.isInitialLoad) {
                ganttChart.isInitialLoad = true;

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
            }
        } catch (error) {
            console.error('Erro na função dataBound:', error);
        }
    };
}
