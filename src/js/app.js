let formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRT'
});  

$(document).ready(() => {
    
    // Habilitar máscara de valores monetários
    $(':input').inputmask();

    // Habilitar tootips
    $('[data-toggle="tooltip"]').tooltip();

    // Resetar texto ao clicar
    $(':input[type="text"]').each(function(i, e) { 
        var defaultValue = $(e).val().toString().replace(/(\d)\.(\d)/g, '$1$2');
        $(`#${e.id}`).click(function(){ $(this).val("") });
        $(`#${e.id}`).blur(function(){ if ($(this).val() === "") $(this).val(defaultValue) })
    });

    // Data default é o mês seguinte
    const proximoMes = new Date();
    proximoMes.setDate(14);
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    $('#dt-primeira-parcela').val(proximoMes.toISOString().substring(0,10));

    // Visualizar valor do Range em tempo real
    $(document).on('input change', '#qtd-parcelas-range', function() {
        $('#qtd-parcelas').val($(this).val())
    });

    // Adiciona input de Anuais por quantidade de anos de acordo com a quantidade de parcelas
    $('#qtd-parcelas-range').change(function() {

        const qtdParcelas = $(this).val();
        const anos = Math.ceil(qtdParcelas / 12);

        let html = "";
        $('#anuais').html(html);
        for(let i = 0; i < anos; i++) {
            html += `
                <label for="anuais">Anual #${i+1}</label>
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                    <span class="input-group-text">R$</span>
                    </div>
                    <input 
                        type="text" 
                        class="form-control" 
                        id="anual${i+1}"   
                        value="10000"
                        aria-label="anual${i+1}" 
                        aria-describedby="anuais-help" />
                </div>`;
        }

        $('#anuais').html(html);
        $('#anuais input[type=text]').inputmask({
            'alias': 'currency', 
            'allowMinus': false, 
            'groupSeparator': '.', 
            'radixPoint': ',', 
            'autoGroup': true, 
            'digits': 2, 
            'digitsOptional': false, 
            'prefix': '', 
            'unmaskAsNumber': true, 
            'autoUnmask': true, 
            'placeholder': '0'
        });
        
    });

    // Habilitar valor extra de acordo com checkbox
    $('#havera-valor-extra').change(function() {
        $('#valor-extra').prop("disabled", !$(this).is(':checked'));
    });

    // Habilitar Evento de click para calcular
    $('#bt-calcular').click(function(event) {
        event.preventDefault();
        calcular();
    });

    // Oculta tabela
    $('#lancamentos').hide();
    $('#sugestoes').hide();
});

function calcular() {

    $('#lancamentos').hide();
    
    const inputs = [];
    inputs['anuais'] = [];
    $(':input').each(function(i, e) { 
        
        const obj = $(e);
        const value = obj.val().toString().replace(/(\d)\.(\d)/g, '$1$2');

        // Se for um dos campos dinâmicos de valores anuais
        if(e.id.includes('anual')) {
            inputs['anuais'] = [...inputs['anuais'], Number(value)]; 
        }
        else if(obj.is(':checkbox')) {
            inputs[e.id] = $(e).is(':checked');
        }
        // Para qualquer outro campo
        else {
            const value = obj.val().toString().replace(/(\d)\.(\d)/g, '$1$2');
            isNaN(value) ? (inputs[e.id] = value) : (inputs[e.id] = Number(value));
        }
    });

    console.log(inputs);
    
    let anual = 0;
    let dataParcela = new Date(Date.parse(inputs['dt-primeira-parcela']));
    
    /**
     * Montagem da estrutura de cálculo
     * Ano > Mês > Valores
     */
    let lancamentos = [];
    for(let i = 0; i < inputs['qtd-parcelas']; i++) {
        
        const ano = dataParcela.getFullYear();
        const mes = dataParcela.getMonth() + 1;

        lancamentos[i] = { 
            'ano': ano, 
            'mes': mes, 
            'valores': [{ ident: 'Parcela mensal', valor: inputs['parcelas'] }],
            'valoresExtras': []
        };

        // Ato
        if (i == 0) 
            lancamentos[i].valores.push({ ident: 'Ato', valor: inputs['ato'] });
        // 30 / 06 Dias
        else if (i == 1) 
            lancamentos[i].valores.push({ ident: '30 Dias', valor: inputs['30-60'] });
        // 30 / 06 Dias
        else if (i == 2) 
            lancamentos[i].valores.push({ ident: '60 Dias', valor: inputs['30-60'] });
        
        // Anuais
        if(dataParcela.getMonth() == 11)
            lancamentos[i].valores.push({ ident: (anual + 1) + 'ª Anual', valor: inputs['anuais'][anual++] });
        
        // Ultima Parcela 
        if (i == inputs['qtd-parcelas'] - 1) {
            lancamentos[i].valoresExtras = [{ ident: 'Parcela Única', valor: inputs['parcela-unica'] }];
            if(inputs['havera-valor-extra'])
                lancamentos[i].valoresExtras.push({ ident: 'Valor Extra', valor: inputs['valor-extra'] })
        }

        dataParcela.setMonth(dataParcela.getMonth() + 1);
        if(dataParcela.getMonth() > 11) {
            dataParcela.setFullYear(dataParcela.getFullYear() + 1);
        }
    }

    criarTabelaDeLancamentos(lancamentos);
    criarTabelaDeSugestoes(lancamentos, inputs['valor-total']);

    // Reinicializar Tootips
    $('[data-toggle="tooltip"]').tooltip();

    // Mostrar tabelas
    $('#lancamentos').show();
    $('#sugestoes').show();
}

function criarTabelaDeLancamentos(lancamentos) {

    let parcela = 1;
    $('#lancamentos table tbody')
        .html("")
        .append(lancamentos.map(l => 
            `<tr>
                <th scope="row">${parcela++}</th>
                <td>${l.mes < 10 ? "0" : ""}${l.mes}/${l.ano}</td>
                <td class="text-left">
                    ${l.valores.reduce((acc, cur) => acc + 
                        `+<span data-toggle="tooltip" data-placement="top" 
                        title="${cur.ident}">
                            <u>${formatter.format(cur.valor).replace('BRT', 'R$')}</u>
                        </span>`, "").substring(1)}
                    ${l.valoresExtras.reduce((acc, cur) => acc + 
                        `+<span data-toggle="tooltip" data-placement="top" 
                        title="${cur.ident}">
                            <u>${formatter.format(cur.valor).replace('BRT', 'R$')}</u>
                        </span>`, "")
                    }
                </td>
            </tr>`
        ).reduce((acc, cur) => acc + cur));
}

function criarTabelaDeSugestoes(lancamentos, valorTotal) {

    const valoresSumarizados = sumarizarValores(lancamentos);
    const valoresExtras = lancamentos[lancamentos.length - 1].valoresExtras
        .map(v => v.valor)
        .reduce((acc, cur) => acc + cur);
    
    const registroEscritura = calculoEscritura(valorTotal);

    $('#sugestoes table tbody')
        .html("")
        .append(valoresSumarizados.valoresAnuais.map((s, i, arr) => {

            console.log(s);

            const valorMensalidade = (s.total / s.qtdParcelas) 
                + (valoresExtras / lancamentos.length)
                + (registroEscritura / lancamentos.length);

            return `<tr>
                <th scope="row">${s.ano} (x${s.qtdParcelas})</th>
                <td class="text-left">
                    ${formatter.format(valorMensalidade).replace('BRT', 'R$')}/mês
                </td>
            </tr>`
        }).reduce((acc, cur) => acc + cur));
}

function calcularMensalidade(valoresAnuais, valoresExtras, valorTotal, numParcelas) {

    const registroEscritura = calculoEscritura(valorTotal);
    
    let valorMensalidade = (valoresAnuais.total / valoresAnuais.qtdParcelas);
    valorMensalidade += (valoresExtras / numParcelas) + (registroEscritura / numParcelas);

    return valorMensalidade;
}

function sumarizarValores(lancamentos) {

    let index = -1;
    let valorTotalLancamento = 0;
    const valoresAnuais = lancamentos.reduce((acc, cur, idx) => {

        if(typeof acc[index] === 'undefined' || acc[index].ano != cur.ano) {
            index++;
            acc[index] = { 'ano': cur.ano, 'qtdParcelas': 0, 'total': 0.0 };
        }

        const totalMensal = cur.valores.reduce((acc, cur) => acc + cur.valor, 0);
        valorTotalLancamento += totalMensal;
        acc[index] = {
            ...acc[index],
            'qtdParcelas': acc[index].qtdParcelas + 1,
            'total': (acc[index].total || 0) + totalMensal
        };

        return acc;
    }, []);

    return { valoresAnuais, valorTotalLancamento };
}

function calculoEscritura(valorTotal) {

    const ITBI = valorTotal * 0.02;
    const FUNREJUS = valorTotal * 0.002;
    const taxaCertidao = 150;
    const taxaEscritura = 708.29;
    const taxaRegistro = 613.09;
    
    return ITBI + FUNREJUS + taxaCertidao + taxaEscritura + taxaRegistro;
}