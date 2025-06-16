class DiabetesRiskDashboard {
    constructor() {
        this.data = [];
        this.userProfile = {
            age: 50,
            bmi: 25,
            highBP: false,
            highChol: false,
            smoker: false,
            noExercise: false,
            heartDisease: false,
            stroke: false
        };
        
        this.tooltip = d3.select('#tooltip');
        this.init();
    }

    async init() {
        await this.loadData();
        this.updateHeroStats();
        this.createConstellationMap();
        this.createRiskDistribution();
        this.createRiskFactorsChart();
        this.createAgeDistributionChart();
        this.createPopulationScatter();
        this.setupEventListeners();
        this.updateUserRisk();
    }

    async loadData() {
        try {
            // Try different paths for the CSV file
            const possiblePaths = [
                "diabetes_012_health_indicators_BRFSS2015.csv",
                "./diabetes_012_health_indicators_BRFSS2015.csv",
                "data/diabetes_012_health_indicators_BRFSS2015.csv",
                "../diabetes_012_health_indicators_BRFSS2015.csv"
            ];
            
            let data = null;
            let loadError = null;
            
            // Try each path until one works
            for (const path of possiblePaths) {
                try {
                    console.log(`Trying to load CSV from: ${path}`);
                    data = await d3.csv(path, d => ({
                        id: Math.random().toString(36).substr(2, 9),
                        diabetes: +d.Diabetes_012,
                        age: this.mapAgeGroup(+d.Age),
                        ageGroup: +d.Age,
                        bmi: +d.BMI,
                        gender: +d.Sex === 1 ? 'male' : 'female',
                        highBP: +d.HighBP === 1,
                        highChol: +d.HighChol === 1,
                        smoker: +d.Smoker === 1,
                        noExercise: +d.PhysActivity === 0,
                        heartDisease: +d.HeartDiseaseorAttack === 1,
                        stroke: +d.Stroke === 1,
                        genHealth: +d.GenHlth,
                        mentHealth: +d.MentHlth,
                        physHealth: +d.PhysHlth,
                        diffWalk: +d.DiffWalk === 1,
                        fruits: +d.Fruits === 1,
                        veggies: +d.Veggies === 1,
                        hvyAlcohol: +d.HvyAlcoholConsump === 1
                    }));
                    
                    if (data && data.length > 0) {
                        console.log(`Successfully loaded ${data.length} records from ${path}`);
                        this.data = data;
                        break;
                    }
                } catch (error) {
                    loadError = error;
                    console.log(`Failed to load from ${path}:`, error.message);
                }
            }
            
            // If no data was loaded, show error and use sample data
            if (!this.data || this.data.length === 0) {
                console.error("Could not load CSV data from any path. Please ensure the CSV file is in the correct location.");
                this.showDataLoadError();
                // Use sample data for demonstration
                this.useSampleData();
                return;
            }

            // Calculate risk scores
            this.data.forEach(d => {
                d.riskScore = this.calculateRiskScore(d);
                d.riskFactors = d.highBP + d.highChol + d.smoker + d.stroke + 
                               d.heartDisease + d.hvyAlcohol + (d.noExercise ? 1 : 0);
                d.healthBurden = Math.max(d.mentHealth, d.physHealth);
            });

            console.log(`Data processing complete. Loaded ${this.data.length} records`);
        } catch (error) {
            console.error("Error in data loading process:", error);
            this.showDataLoadError();
            this.useSampleData();
        }
    }

    showDataLoadError() {
        // Add an error message to the page
        const heroSection = document.querySelector('.hero');
        if (heroSection && !document.querySelector('.data-error')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'data-error';
            errorDiv.style.cssText = 'background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; padding: 15px; margin: 20px auto; max-width: 600px; border-radius: 10px; text-align: center;';
            errorDiv.innerHTML = `
                <strong>⚠️ Data Loading Error</strong><br>
                Could not load the CSV file. Please ensure 'diabetes_012_health_indicators_BRFSS2015.csv' is in the correct directory.<br>
                <small>Using sample data for demonstration purposes.</small>
            `;
            heroSection.appendChild(errorDiv);
        }
    }

    useSampleData() {
        // Generate sample data for demonstration
        console.log("Generating sample data for demonstration...");
        this.data = [];
        
        // Generate 10000 sample records with realistic distributions
        for (let i = 0; i < 10000; i++) {
            const ageGroup = Math.floor(Math.random() * 13) + 1;
            const age = this.mapAgeGroup(ageGroup);
            const bmi = 18 + Math.random() * 27; // BMI 18-45
            
            // Risk factors with age-based probability
            const ageFactor = age / 100;
            const highBP = Math.random() < (0.2 + ageFactor * 0.3);
            const highChol = Math.random() < (0.2 + ageFactor * 0.2);
            const smoker = Math.random() < 0.15;
            const noExercise = Math.random() < (0.3 + ageFactor * 0.2);
            const heartDisease = Math.random() < (0.05 + ageFactor * 0.15);
            const stroke = Math.random() < (0.02 + ageFactor * 0.08);
            
            // Diabetes probability based on risk factors
            const riskCount = highBP + highChol + smoker + noExercise + heartDisease + stroke + (bmi > 30 ? 1 : 0);
            const diabetesProbability = 0.05 + (riskCount * 0.08) + (ageFactor * 0.1);
            const diabetes = Math.random() < diabetesProbability ? (Math.random() < 0.7 ? 2 : 1) : 0;
            
            const record = {
                id: Math.random().toString(36).substr(2, 9),
                diabetes: diabetes,
                age: age,
                ageGroup: ageGroup,
                bmi: bmi,
                gender: Math.random() < 0.5 ? 'male' : 'female',
                highBP: highBP,
                highChol: highChol,
                smoker: smoker,
                noExercise: noExercise,
                heartDisease: heartDisease,
                stroke: stroke,
                genHealth: Math.floor(Math.random() * 5) + 1,
                mentHealth: Math.floor(Math.random() * 31),
                physHealth: Math.floor(Math.random() * 31),
                diffWalk: Math.random() < (0.1 + ageFactor * 0.2),
                fruits: Math.random() < 0.6,
                veggies: Math.random() < 0.7,
                hvyAlcohol: Math.random() < 0.05
            };
            
            record.riskScore = this.calculateRiskScore(record);
            record.riskFactors = record.highBP + record.highChol + record.smoker + 
                                record.stroke + record.heartDisease + record.hvyAlcohol + 
                                (record.noExercise ? 1 : 0);
            record.healthBurden = Math.max(record.mentHealth, record.physHealth);
            
            this.data.push(record);
        }
        
        console.log(`Generated ${this.data.length} sample records`);
    }

    // Create representative sample using stratified sampling with adaptive sampling
    createRepresentativeSample(targetSize) {
        if (!this.data || this.data.length === 0) {
            console.warn("No data available for sampling");
            return [];
        }
        
        // Simple random sampling for other uses
        const shuffled = d3.shuffle([...this.data]);
        return shuffled.slice(0, targetSize);
    }

    mapAgeGroup(ageCode) {
        const ageMap = {
            1: 21, 2: 27, 3: 32, 4: 37, 5: 42,
            6: 47, 7: 52, 8: 57, 9: 62, 10: 67,
            11: 72, 12: 77, 13: 82
        };
        return ageMap[ageCode] || 50;
    }

    getAgeGroupLabel(ageCode) {
        const ageLabels = {
            1: "18-24 years",
            2: "25-29 years", 
            3: "30-34 years",
            4: "35-39 years",
            5: "40-44 years",
            6: "45-49 years",
            7: "50-54 years",
            8: "55-59 years",
            9: "60-64 years",
            10: "65-69 years",
            11: "70-74 years",
            12: "75-79 years",
            13: "80+ years"
        };
        return ageLabels[ageCode] || "Unknown";
    }

    calculateRiskScore(profile) {
        let score = 0;
        
        // Age factor
        score += (profile.age - 18) / 25;
        
        // BMI factor
        if (profile.bmi > 30) score += 2.5;
        else if (profile.bmi > 25) score += 1.2;
        
        // Health conditions
        if (profile.highBP) score += 1.8;
        if (profile.highChol) score += 1.2;
        if (profile.smoker) score += 1.5;
        if (profile.noExercise) score += 0.8;
        if (profile.heartDisease) score += 2.0;
        if (profile.stroke) score += 1.5;
        
        // Gender factor
        if (profile.gender === 'male') score += 0.2;
        
        return Math.round(score * 10) / 10;
    }

    getRiskLevel(score) {
        if (score < 2) return 'low';
        if (score < 4) return 'moderate';
        if (score < 6) return 'high';
        return 'severe';
    }

    getRiskColor(score) {
        if (score < 2) return '#2ECC71';
        if (score < 4) return '#F39C12';
        if (score < 6) return '#E67E22';
        return '#E74C3C';
    }

    updateHeroStats() {
        const totalPop = this.data.length;
        const diabetesCount = this.data.filter(d => d.diabetes === 2).length;
        const prediabetesCount = this.data.filter(d => d.diabetes === 1).length;
        const highRiskCount = this.data.filter(d => d.riskScore >= 4).length;

        d3.select('#hero-total').text(totalPop.toLocaleString());
        d3.select('#hero-prevalence').text(((diabetesCount / totalPop) * 100).toFixed(1) + '%');
        d3.select('#hero-prediabetes').text(((prediabetesCount / totalPop) * 100).toFixed(1) + '%');
        d3.select('#hero-high-risk').text(((highRiskCount / totalPop) * 100).toFixed(1) + '%');
    }

    createConstellationMap() {
        const container = d3.select('#constellation-map');
        const rect = container.node().getBoundingClientRect();
        const width = rect.width;
        const height = 700;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        // Create star path generator
        const starPath = (size, points) => {
            const outerRadius = size;
            const innerRadius = size * 0.4;
            let path = "";
            
            for (let i = 0; i < points * 2; i++) {
                const angle = (i * Math.PI) / points;
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const x = Math.cos(angle - Math.PI/2) * radius;
                const y = Math.sin(angle - Math.PI/2) * radius;
                
                if (i === 0) path += `M ${x} ${y}`;
                else path += ` L ${x} ${y}`;
            }
            path += " Z";
            return path;
        };

        // Use 500 representative samples
        const sampleData = this.createSimpleRepresentativeSample(500);

        // Create age group clusters
        const ageGroups = [...new Set(sampleData.map(d => d.ageGroup))].sort((a, b) => a - b);
        const clusterCenters = {};
        
        // Arrange age groups in a circular pattern
        ageGroups.forEach((age, i) => {
            const angle = (i / ageGroups.length) * 2 * Math.PI - Math.PI/2;
            const radius = Math.min(width, height) * 0.35;
            clusterCenters[age] = {
                x: width/2 + Math.cos(angle) * radius,
                y: height/2 + Math.sin(angle) * radius
            };
        });

        // Position each person within their age group cluster
        sampleData.forEach(d => {
            const center = clusterCenters[d.ageGroup];
            const scatter = 80;
            const healthOffset = (d.genHealth - 3) * 25;
            
            d.x = center.x + (Math.random() - 0.5) * scatter + healthOffset;
            d.y = center.y + (Math.random() - 0.5) * scatter;
        });

        // Add glow filter
        const defs = svg.append("defs");
        const filter = defs.append("filter")
            .attr("id", "glow");
        
        filter.append("feGaussianBlur")
            .attr("stdDeviation", 3)
            .attr("result", "coloredBlur");
        
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Size scale for BMI
        const sizeScale = d3.scaleSqrt()
            .domain(d3.extent(sampleData, d => d.bmi))
            .range([8, 20]);

        // Create health stars
        const healthStars = svg.selectAll(".health-star")
            .data(sampleData)
            .enter().append("g")
            .attr("class", "health-star")
            .attr("transform", d => `translate(${d.x}, ${d.y})`);

        // Add stars
        healthStars.append("path")
            .attr("d", d => starPath(sizeScale(d.bmi), Math.max(3, d.riskFactors + 2)))
            .style("fill", d => {
                if (d.diabetes === 0) return "#4A90E2";
                if (d.diabetes === 1) return "#F5A623";
                return "#D0021B";
            })
            .style("stroke", "#fff")
            .style("stroke-width", 0.5)
            .style("opacity", 0.8)
            .style("filter", d => d.healthBurden > 10 ? "url(#glow)" : "none");

        // Add pulsing animation for high-risk individuals
        healthStars
            .filter(d => d.riskFactors >= 4)
            .append("circle")
            .attr("r", d => sizeScale(d.bmi) + 5)
            .style("fill", "none")
            .style("stroke", "#ff4444")
            .style("stroke-width", 2)
            .style("opacity", 0.6)
            .append("animate")
            .attr("attributeName", "r")
            .attr("values", d => `${sizeScale(d.bmi) + 5};${sizeScale(d.bmi) + 15};${sizeScale(d.bmi) + 5}`)
            .attr("dur", "2s")
            .attr("repeatCount", "indefinite");

        // Add drag behavior
        const drag = d3.drag()
            .on("start", function(event, d) {
                d3.select(this).raise(); // Bring to front
                d3.select(this).style("cursor", "grabbing");
            })
            .on("drag", function(event, d) {
                d.x = event.x;
                d.y = event.y;
                d3.select(this).attr("transform", `translate(${d.x}, ${d.y})`);
                
                // Update any constellation lines if they're showing
                svg.selectAll(".constellation-line").remove();
            })
            .on("end", function(event, d) {
                d3.select(this).style("cursor", "grab");
            });

        // Add interactivity with drag
        healthStars
            .style("cursor", "grab")
            .call(drag)
            .on("mouseover", (event, d) => {
                // Don't trigger hover effects while dragging
                if (!event.buttons) {
                    d3.select(event.currentTarget)
                        .transition()
                        .duration(200)
                        .attr("transform", `translate(${d.x}, ${d.y}) scale(1.3)`);
                    
                    // Show constellation lines to similar profiles
                    svg.selectAll(".constellation-line").remove();
                    sampleData.forEach(other => {
                        if (other.id !== d.id && Math.abs(other.riskFactors - d.riskFactors) <= 1) {
                            svg.append("line")
                                .attr("class", "constellation-line")
                                .attr("x1", d.x)
                                .attr("y1", d.y)
                                .attr("x2", other.x)
                                .attr("y2", other.y)
                                .style("opacity", 0.3);
                        }
                    });
                    
                    this.showTooltip(event, d);
                }
            })
            .on("mouseout", (event, d) => {
                // Don't trigger hover effects while dragging
                if (!event.buttons) {
                    d3.select(event.currentTarget)
                        .transition()
                        .duration(200)
                        .attr("transform", `translate(${d.x}, ${d.y}) scale(1)`);
                    
                    svg.selectAll(".constellation-line").remove();
                    this.hideTooltip();
                }
            });
    }

    // Simple representative sampling for 500 points
    createSimpleRepresentativeSample(targetSize) {
        if (!this.data || this.data.length === 0) {
            console.warn("No data available for sampling");
            return [];
        }
        
        // Simple random sampling
        const shuffled = d3.shuffle([...this.data]);
        const sample = shuffled.slice(0, targetSize);
        
        console.log(`Created simple sample of ${sample.length} from ${this.data.length} records`);
        return sample;
    }

    showTooltip(event, d) {
        const diabetesStatus = ['No Diabetes', 'Prediabetes', 'Diabetes'][d.diabetes];
        const healthStatus = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'][d.genHealth - 1];
        
        const conditions = [];
        if (d.highBP) conditions.push('High BP');
        if (d.highChol) conditions.push('High Cholesterol');
        if (d.smoker) conditions.push('Smoker');
        if (d.noExercise) conditions.push('No Exercise');
        if (d.heartDisease) conditions.push('Heart Disease');
        if (d.stroke) conditions.push('Stroke');

        const content = `
            <strong>Health Constellation Profile</strong><br/>
            Age: ${this.getAgeGroupLabel(d.ageGroup)} (${d.age} years)<br/>
            BMI: ${d.bmi.toFixed(1)}<br/>
            Risk Score: ${d.riskScore.toFixed(1)}<br/>
            Diabetes Status: ${diabetesStatus}<br/>
            General Health: ${healthStatus}<br/>
            Risk Factors: ${d.riskFactors}<br/>
            Health Burden Days: ${d.healthBurden}<br/>
            ${conditions.length ? '<br/>Active Conditions: ' + conditions.join(', ') : ''}
        `;

        this.tooltip
            .style('opacity', 1)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(content);
    }

    createRiskDistribution() {
        const container = d3.select('#risk-distribution');
        const rect = container.node().getBoundingClientRect();
        const width = rect.width - 40;
        const height = 360;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Group data by risk level
        const riskGroups = d3.rollup(this.data,
            v => v.length,
            d => Math.floor(d.riskScore)
        );

        const data = Array.from(riskGroups, ([score, count]) => ({ score, count }))
            .sort((a, b) => a.score - b.score);

        // Scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.score))
            .range([0, plotWidth])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([plotHeight, 0]);

        // Bars
        g.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.score))
            .attr('y', d => y(d.count))
            .attr('width', x.bandwidth())
            .attr('height', d => plotHeight - y(d.count))
            .attr('fill', d => this.getRiskColor(d.score))
            .attr('opacity', 0.8);

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${plotHeight})`)
            .call(d3.axisBottom(x).tickFormat(d => `${d}-${d+1}`))
            .append('text')
            .attr('x', plotWidth / 2)
            .attr('y', 35)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text('Risk Score Range');

        g.append('g')
            .call(d3.axisLeft(y).tickFormat(d => {
                if (d >= 1000) {
                    return `${(d/1000).toFixed(d % 1000 === 0 ? 0 : 1)}k`;
                }
                return d;
            }))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -35)
            .attr('x', -plotHeight / 2)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text('Number of Individuals');
    }

    createRiskFactorsChart() {
        const container = d3.select('#risk-factors-chart');
        const rect = container.node().getBoundingClientRect();
        const width = rect.width;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 100, left: 60 };

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate prevalence of each risk factor
        const riskFactors = [
            { name: 'High Blood Pressure', key: 'highBP' },
            { name: 'High Cholesterol', key: 'highChol' },
            { name: 'Smoker', key: 'smoker' },
            { name: 'No Exercise', key: 'noExercise' },
            { name: 'Heart Disease', key: 'heartDisease' },
            { name: 'Stroke', key: 'stroke' }
        ];

        const data = riskFactors.map(factor => ({
            name: factor.name,
            prevalence: (this.data.filter(d => d[factor.key]).length / this.data.length) * 100
        }));

        // Scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.name))
            .range([0, plotWidth])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.prevalence)])
            .range([plotHeight, 0]);

        // Bars
        g.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('x', d => x(d.name))
            .attr('y', d => y(d.prevalence))
            .attr('width', x.bandwidth())
            .attr('height', d => plotHeight - y(d.prevalence))
            .attr('fill', '#667eea')
            .attr('opacity', 0.8);

        // Values on bars
        g.selectAll('.bar-value')
            .data(data)
            .enter().append('text')
            .attr('x', d => x(d.name) + x.bandwidth() / 2)
            .attr('y', d => y(d.prevalence) - 5)
            .attr('text-anchor', 'middle')
            .text(d => d.prevalence.toFixed(1) + '%')
            .style('font-size', '12px')
            .style('font-weight', 'bold');

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${plotHeight})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        g.append('g')
            .call(d3.axisLeft(y))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -40)
            .attr('x', -plotHeight / 2)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text('Prevalence (%)');
    }

    createAgeDistributionChart() {
        const container = d3.select('#age-distribution-chart');
        const rect = container.node().getBoundingClientRect();
        const width = rect.width;
        const height = 400;
        const margin = { top: 20, right: 120, bottom: 80, left: 60 };

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Group data by age and diabetes status
        const ageData = d3.rollup(this.data,
            v => ({
                none: v.filter(d => d.diabetes === 0).length,
                pre: v.filter(d => d.diabetes === 1).length,
                diabetes: v.filter(d => d.diabetes === 2).length
            }),
            d => d.ageGroup
        );

        const data = Array.from(ageData, ([age, counts]) => ({
            age,
            ageLabel: this.getAgeGroupLabel(age),
            ...counts,
            total: counts.none + counts.pre + counts.diabetes
        })).sort((a, b) => a.age - b.age);

        // Stack the data
        const stack = d3.stack()
            .keys(['none', 'pre', 'diabetes']);

        const series = stack(data);

        // Scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.age))
            .range([0, plotWidth])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total)])
            .range([plotHeight, 0]);

        const color = d3.scaleOrdinal()
            .domain(['none', 'pre', 'diabetes'])
            .range(['#4A90E2', '#F5A623', '#D0021B']);

        // Create tooltip group for this chart
        const barTooltip = d3.select("body").append("div")
            .attr("class", "bar-tooltip")
            .style("position", "absolute")
            .style("opacity", 0)
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("pointer-events", "none");

        // Add bars with interactivity
        const barGroups = g.selectAll('g.series')
            .data(series)
            .enter().append('g')
            .attr('class', 'series')
            .attr('fill', d => color(d.key));

        barGroups.selectAll('rect')
            .data(d => d)
            .enter().append('rect')
            .attr('x', d => x(d.data.age))
            .attr('y', d => y(d[1]))
            .attr('height', d => y(d[0]) - y(d[1]))
            .attr('width', x.bandwidth())
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                const seriesKey = d3.select(this.parentNode).datum().key;
                const statusName = seriesKey === 'none' ? 'No Diabetes' : 
                                 seriesKey === 'pre' ? 'Prediabetes' : 'Diabetes';
                const count = d[1] - d[0];
                const percentage = ((count / d.data.total) * 100).toFixed(1);
                
                // Highlight the bar
                d3.select(this)
                    .style('opacity', 0.8)
                    .style('stroke', '#333')
                    .style('stroke-width', 2);
                
                // Show tooltip
                barTooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                
                barTooltip.html(`
                    <strong>${d.data.ageLabel}</strong><br/>
                    <div style="margin-top: 5px;">
                        <strong>${statusName}:</strong> ${count.toLocaleString()} (${percentage}%)<br/>
                        <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #555;">
                            Total in age group: ${d.data.total.toLocaleString()}<br/>
                            No Diabetes: ${d.data.none.toLocaleString()} (${(d.data.none/d.data.total*100).toFixed(1)}%)<br/>
                            Prediabetes: ${d.data.pre.toLocaleString()} (${(d.data.pre/d.data.total*100).toFixed(1)}%)<br/>
                            Diabetes: ${d.data.diabetes.toLocaleString()} (${(d.data.diabetes/d.data.total*100).toFixed(1)}%)
                        </div>
                    </div>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mousemove', function(event) {
                barTooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('opacity', 1)
                    .style('stroke', 'none');
                
                barTooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // X-axis with better formatting
        g.append('g')
            .attr('transform', `translate(0,${plotHeight})`)
            .call(d3.axisBottom(x).tickFormat(d => this.getAgeGroupLabel(d)))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)')
            .style('font-size', '11px');

        g.append('text')
            .attr('x', plotWidth / 2)
            .attr('y', plotHeight + 70)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Age Groups');

        // Y-axis with k formatting
        g.append('g')
            .call(d3.axisLeft(y).tickFormat(d => {
                if (d >= 1000) {
                    return `${(d/1000).toFixed(d % 1000 === 0 ? 0 : 1)}k`;
                }
                return d;
            }))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -45)
            .attr('x', -plotHeight / 2)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Number of Individuals');

        // Interactive legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);

        const legendItems = [
            { key: 'none', label: 'No Diabetes', color: '#4A90E2' },
            { key: 'pre', label: 'Prediabetes', color: '#F5A623' },
            { key: 'diabetes', label: 'Diabetes', color: '#D0021B' }
        ];

        legendItems.forEach((item, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 25})`)
                .style('cursor', 'pointer');

            legendRow.append('rect')
                .attr('width', 18)
                .attr('height', 18)
                .attr('fill', item.color)
                .attr('rx', 2);

            legendRow.append('text')
                .attr('x', 24)
                .attr('y', 14)
                .text(item.label)
                .style('font-size', '13px')
                .style('alignment-baseline', 'middle');
            
            // Legend interactivity
            legendRow.on('mouseover', function() {
                // Highlight corresponding bars
                barGroups.selectAll('rect')
                    .style('opacity', d => {
                        const seriesKey = d3.select(d).datum().key;
                        return seriesKey === item.key ? 1 : 0.3;
                    });
                
                d3.select(this).select('rect')
                    .attr('stroke', '#333')
                    .attr('stroke-width', 2);
            })
            .on('mouseout', function() {
                barGroups.selectAll('rect')
                    .style('opacity', 1);
                
                d3.select(this).select('rect')
                    .attr('stroke', 'none');
            });
        });

        // Clean up on component unmount
        this.ageDistTooltip = barTooltip;
    }

    createPopulationScatter() {
        const container = d3.select('#population-scatter');
        const rect = container.node().getBoundingClientRect();
        const width = rect.width;
        const height = 600;
        const margin = { top: 20, right: 20, bottom: 50, left: 50 };

        this.scatterSVG = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        this.scatterG = this.scatterSVG.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        this.xScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.riskScore) + 1])
            .range([0, plotWidth]);

        this.yScale = d3.scaleLinear()
            .domain([18, d3.max(this.data, d => d.age) + 5])
            .range([plotHeight, 0]);

        // Background gradient
        const defs = this.scatterSVG.append('defs');
        const gradient = defs.append('radialGradient')
            .attr('id', 'scatter-gradient')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '50%');

        gradient.append('stop')
            .attr('offset', '0%')
            .style('stop-color', '#f8f9fa');

        gradient.append('stop')
            .attr('offset', '100%')
            .style('stop-color', '#e9ecef');

        this.scatterG.append('rect')
            .attr('width', plotWidth)
            .attr('height', plotHeight)
            .attr('fill', 'url(#scatter-gradient)')
            .attr('opacity', 0.5);

        // Axes
        this.scatterG.append('g')
            .attr('transform', `translate(0,${plotHeight})`)
            .call(d3.axisBottom(this.xScale))
            .append('text')
            .attr('x', plotWidth / 2)
            .attr('y', 40)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Risk Score');

        this.scatterG.append('g')
            .call(d3.axisLeft(this.yScale))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -35)
            .attr('x', -plotHeight / 2)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Age');

        // Sample data for performance
        const sampleData = this.data.slice(0, 5000);

        // Population dots
        this.scatterG.selectAll('.population-dot')
            .data(sampleData)
            .enter().append('circle')
            .attr('class', 'population-dot')
            .attr('cx', d => this.xScale(d.riskScore))
            .attr('cy', d => this.yScale(d.age))
            .attr('r', 3)
            .attr('fill', d => this.getRiskColor(d.riskScore))
            .attr('opacity', 0.6)
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());

        // Personal dot (you)
        this.personalDot = this.scatterG.append('path')
            .attr('class', 'personal-dot')
            .attr('d', d3.symbol().type(d3.symbolStar).size(200))
            .attr('fill', '#FFD700')
            .attr('stroke', '#333')
            .attr('stroke-width', 2);

        this.updatePersonalDot();
    }

    updatePersonalDot() {
        const riskScore = this.calculateRiskScore(this.userProfile);
        
        this.personalDot.transition()
            .duration(800)
            .attr('transform', `translate(${this.xScale(riskScore)}, ${this.yScale(this.userProfile.age)})`);
    }

    setupEventListeners() {
        // Age slider
        d3.select('#age-slider').on('input', (event) => {
            this.userProfile.age = +event.target.value;
            d3.select('#age-value').text(this.userProfile.age);
            this.updateUserRisk();
            this.updatePersonalDot();
        });

        // BMI slider
        d3.select('#bmi-slider').on('input', (event) => {
            this.userProfile.bmi = +event.target.value;
            d3.select('#bmi-value').text(this.userProfile.bmi.toFixed(1));
            this.updateUserRisk();
            this.updatePersonalDot();
        });

        // Checkboxes
        const checkboxes = [
            { id: 'high-bp', key: 'highBP' },
            { id: 'high-chol', key: 'highChol' },
            { id: 'smoker', key: 'smoker' },
            { id: 'no-exercise', key: 'noExercise' },
            { id: 'heart-disease', key: 'heartDisease' },
            { id: 'stroke', key: 'stroke' }
        ];

        checkboxes.forEach(checkbox => {
            d3.select(`#${checkbox.id}`).on('change', (event) => {
                this.userProfile[checkbox.key] = event.target.checked;
                this.updateUserRisk();
                this.updatePersonalDot();
            });
        });
    }

    updateUserRisk() {
        const riskScore = this.calculateRiskScore(this.userProfile);
        const riskLevel = this.getRiskLevel(riskScore);

        // Update risk display
        d3.select('#risk-score').text(riskScore.toFixed(1));
        
        const riskLabels = {
            'low': 'Low Risk',
            'moderate': 'Moderate Risk',
            'high': 'High Risk',
            'severe': 'Very High Risk'
        };

        d3.select('#risk-category').text(riskLabels[riskLevel]);
        d3.select('#risk-bar-fill').style('width', `${Math.min(100, (riskScore / 8) * 100)}%`);

        // Find similar profiles
        const similarProfiles = this.data.filter(d => 
            Math.abs(d.riskScore - riskScore) < 0.5 &&
            Math.abs(d.age - this.userProfile.age) < 10 &&
            Math.abs(d.bmi - this.userProfile.bmi) < 3
        );

        const diabetesInGroup = similarProfiles.filter(d => d.diabetes === 2).length;
        const diabetesRate = similarProfiles.length > 0 ? 
            (diabetesInGroup / similarProfiles.length) * 100 : 0;

        d3.select('#similar-profiles').text(similarProfiles.length.toLocaleString());
        d3.select('#group-diabetes-rate').text(diabetesRate.toFixed(1) + '%');
    }

    showTooltip(event, d) {
        const diabetesStatus = ['No Diabetes', 'Prediabetes', 'Diabetes'][d.diabetes];
        const healthStatus = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'][d.genHealth - 1];
        
        const conditions = [];
        if (d.highBP) conditions.push('High BP');
        if (d.highChol) conditions.push('High Cholesterol');
        if (d.smoker) conditions.push('Smoker');
        if (d.noExercise) conditions.push('No Exercise');
        if (d.heartDisease) conditions.push('Heart Disease');
        if (d.stroke) conditions.push('Stroke');

        const content = `
            <strong>Individual Profile</strong><br/>
            Age: ${d.age}<br/>
            BMI: ${d.bmi.toFixed(1)}<br/>
            Risk Score: ${d.riskScore.toFixed(1)}<br/>
            Diabetes Status: ${diabetesStatus}<br/>
            General Health: ${healthStatus}<br/>
            ${conditions.length ? '<br/>Conditions: ' + conditions.join(', ') : ''}
        `;

        this.tooltip
            .style('opacity', 1)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(content);
    }

    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DiabetesRiskDashboard();
});