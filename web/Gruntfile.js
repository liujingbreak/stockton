module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
          files: ['app.js', 'routes/*.js', 'public/**/*.js'],
          // JSHint options http://jshint.com/docs/options/
          options: {
            //jshintrc: '.jshintrc'
            strict: false,
            //es3: true,
            node: true
          }
        },
        watch: {
          scripts: {
            files: ['*.js', 'routes/*.js'],
            tasks: ['jshint'] // , 'concat', 'uglify'
          }
        }
    });
    
    //grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    //grunt.loadNpmTasks('grunt-contrib-concat');
    //grunt.loadNpmTasks('grunt-contrib-less');
    
    // Default task(s) - will be run by writing "grunt" from the command line
    //grunt.registerTask('default', ['less:development', 'jshint', 'csslint']); //, 'concat', 'uglify'
    grunt.registerTask('default', [ 'jshint']);
    // production tasks
    //grunt.registerTask('production', ['less:production', 'jshint', 'csslint', 'concat', 'uglify']);

}
